import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  llm as llmHelper,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as sarvam from '@livekit/agents-plugin-sarvam';
import * as silero from '@livekit/agents-plugin-silero';
import { FORM_SCHEMAS } from './lib/form-schemas';

config({ path: '.env.local' });

const encoder = new TextEncoder();

export default defineAgent({
  /* ---------------- PREWARM ---------------- */

  prewarm: async (proc: JobProcess) => {
    const vad = await silero.VAD.load({
      activationThreshold: 0.7,
      minSpeechDuration: 0.25,
    });

    proc.userData.vad = vad;
  },

  /* ---------------- ENTRY ---------------- */

  entry: async (ctx: JobContext) => {
    /* ---------- VALIDATE METADATA ---------- */

    const metadata = JSON.parse(ctx.job.metadata ?? '{}');
    const serviceType: string = metadata.serviceType;

    if (!serviceType || !FORM_SCHEMAS[serviceType]) {
      throw new Error(`Invalid serviceType: ${serviceType}`);
    }

    const schema = FORM_SCHEMAS[serviceType];

    const fieldIds = schema.fields.map((f) => f.id) as [string, ...string[]];

    /* ---------- SAFE DATA PUBLISH ---------- */

    const publishUpdate = async (type: string, payload: unknown): Promise<void> => {
      const participant = ctx.room.localParticipant;
      if (!participant) return;

      const message = JSON.stringify({ type, payload });
      const data = encoder.encode(message);

      await participant.publishData(data, { reliable: true });
    };

    /* ---------- TOOLS ---------- */

    const updateField = llmHelper.tool({
      description: 'Update a form field.',
      parameters: z.object({
        field: z.enum(fieldIds),
        value: z.string(),
      }),
      execute: async ({ field, value }) => {
        await publishUpdate('form_update', { [field]: value });
        return `Updated ${field}`;
      },
    });

    const focusField = llmHelper.tool({
      description: 'Focus a field before asking.',
      parameters: z.object({
        field: z.enum(fieldIds),
      }),
      execute: async ({ field }) => {
        await publishUpdate('form_focus', { fieldId: field });
        return `Focused ${field}`;
      },
    });

    let submitted = false;

    const submitForm = llmHelper.tool({
      description: 'Submit form after confirmation.',
      parameters: z.object({
        userHasConfirmed: z.boolean().describe('Must be true to submit.'),
      }),
      execute: async ({ userHasConfirmed }) => {
        if (!userHasConfirmed) {
          return 'User confirmation required.';
        }

        if (submitted) {
          return 'Form already submitted.';
        }

        submitted = true;

        await publishUpdate('form_submitted', {
          status: 'success',
        });

        return 'Form submitted successfully.';
      },
    });

    /* ---------- MODELS ---------- */

    const apiKey = process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('Missing API key');
    }

    const MODEL_CHAIN = [
      process.env.GROQ_MODEL,
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'openai/gpt-oss-20b',
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
    ].filter((value): value is string => Boolean(value));

    let llm!: openai.LLM;
    let activeModel = MODEL_CHAIN[MODEL_CHAIN.length - 1];

    for (const model of MODEL_CHAIN) {
      try {
        const candidate = new openai.LLM({
          model,
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey,
        });

        const testCtx = llmHelper.ChatContext.empty();
        testCtx.addMessage({ role: 'user', content: 'hi' });

        const stream = candidate.chat({ chatCtx: testCtx });
        for await (const _ of stream) {
          break;
        }

        llm = candidate;
        activeModel = model;
        console.log(`✅ LLM selected: ${model}`);
        break;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const statusCode =
          typeof error === 'object' && error !== null && 'statusCode' in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;
        const isRateLimited = statusCode === 429 || message.includes('rate_limit_exceeded');

        console.warn(
          `⚠️ ${model} ${isRateLimited ? 'rate-limited' : `failed: ${message}`} — trying next...`
        );
      }
    }

    if (!llm) {
      const fallbackModel = 'llama-3.1-8b-instant';
      llm = new openai.LLM({
        model: fallbackModel,
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey,
      });
      activeModel = fallbackModel;
      console.warn('⚠️ All model probes failed, using llama-3.1-8b-instant directly');
    }

    console.log(`🤖 Active LLM: ${activeModel}`);

    const stt = new sarvam.STT({
      model: 'saaras:v3',
      languageCode: 'unknown',
      flushSignal: true,
    });

    const tts = new sarvam.TTS({
      model: 'bulbul:v3',
      speaker: 'shubh',
      targetLanguageCode: 'en-IN',
      streaming: false,
    });
    tts.setMaxListeners(0);

    /* ---------- AGENT ---------- */

    const agent = new voice.Agent({
      instructions: `
You are Vak Sahayak helping complete:
${schema.title}

Collect fields strictly in order:
${schema.fields.map((f, i) => `${i + 1}. ${f.label} (${f.id})`).join('\n')}

Rules:
- Ask one field at a time
- Call focus_field before asking
- Call update_form_field after valid input
- Never hallucinate
- Only submit after explicit confirmation
- Ensure tool parameters are passed correctly as JSON types (e.g. booleans as true/false, not "true"/"false")
`,
      tools: {
        update_form_field: updateField,
        focus_field: focusField,
        submit_form: submitForm,
      },
    });

    /* ---------- SESSION ---------- */

    const vad = ctx.proc.userData.vad as silero.VAD | undefined;

    if (!vad) {
      throw new Error('VAD not initialized');
    }

    const session = new voice.AgentSession({
      stt,
      llm,
      tts,
      vad,
      turnHandling: {
        turnDetection: 'vad',
        endpointing: { minDelay: 0.1 },
      },
    });

    /* ---------- START SESSION ---------- */

    await ctx.connect();

    await session.start({
      room: ctx.room,
      agent,
      inputOptions: {
        audioEnabled: true,
        textEnabled: true,
        closeOnDisconnect: true,
      },
      outputOptions: {
        transcriptionEnabled: true,
      },
    });

    /* ---------- GREETING ---------- */

    let greeted = false;

    const greet = (): void => {
      if (greeted) return;
      greeted = true;

      session.generateReply({
        instructions: `Welcome the user and ask if they are ready to begin the ${schema.title} form.`,
      });
    };

    if (ctx.room.remoteParticipants.size > 0) {
      greet();
    }

    ctx.room.on('participantConnected', () => {
      greet();
    });

    /* ---------- EVENTS ---------- */

    session.on(voice.AgentSessionEventTypes.Close, () => {
      console.log('Session closed');
    });

    session.on(voice.AgentSessionEventTypes.Error, (e: unknown) => {
      console.error('Session error:', e);
    });

    ctx.addShutdownCallback(async () => {
      await session.close();
    });
  },
});

/* ---------------- CLI ---------------- */

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'vak-sahayak',
    initializeProcessTimeout: 30_000,
  })
);
