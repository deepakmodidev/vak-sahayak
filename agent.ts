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

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const encoder = new TextEncoder();

const GREETING_INSTRUCTIONS = `
Greet the user warmly as "Vak Sahayak". 
Ask if they are ready to begin filling out the form.
Keep it brief and professional.
`;

/* -------------------------------------------------------------------------- */
/*                               INFRASTRUCTURE                               */
/* -------------------------------------------------------------------------- */

let masterLlm: openai.LLM | null = null;
let activeModelName: string = 'unknown';

/**
 * Singleton LLM Prober
 * Ensures we only probe Groq once per worker process to minimize latency.
 */
async function getMasterLlm(): Promise<{ llm: openai.LLM; model: string }> {
  if (masterLlm) return { llm: masterLlm, model: activeModelName };

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('ERR_MISSING_API_KEY: LLM API key required.');

  const MODEL_CHAIN = [
    process.env.GROQ_MODEL,
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.3-70b-versatile',
    'qwen/qwen3-32b',
    'llama-3.1-8b-instant',
  ].filter((v): v is string => Boolean(v));

  console.log('🔍 [INFRA] Probing for fast LLM...');

  for (const model of MODEL_CHAIN) {
    try {
      console.log(`📡 [INFRA] Testing ${model}...`);
      const candidate = new openai.LLM({
        model,
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey,
      });

      // Verification probe: Must yield at least one content token to be considered healthy
      const testCtx = llmHelper.ChatContext.empty();
      testCtx.addMessage({ role: 'user', content: 'say ok' });
      const stream = candidate.chat({ chatCtx: testCtx });
      
      let healthy = false;
      for await (const chunk of stream) {
        if (chunk.delta?.content) {
          healthy = true;
          break;
        }
      }

      if (!healthy) throw new Error('Model produced no content');

      masterLlm = candidate;
      activeModelName = model;
      console.log(`✅ [INFRA] Master LLM selected: ${model}`);
      return { llm: masterLlm, model: activeModelName };
    } catch (e) {
      console.warn(`⚠️ [INFRA] ${model} probe failed: ${(e as Error).message}`);
    }
  }

  throw new Error('FAILED_FAST: No healthy LLM found in chain.');
}

/**
 * Dynamic System Prompt Builder
 */
function buildInstructions(schema: (typeof FORM_SCHEMAS)[keyof typeof FORM_SCHEMAS]) {
  return `
You are Vak Sahayak, a highly efficient AI administrative assistant.
Your goal is to help the user complete: **${schema.title}**

### Dynamic Workflow:
Collect fields strictly in order:
${schema.fields.map((f, i) => `${i + 1}. ${f.label} (${f.id})`).join('\n')}

### Strict Interaction Rules:
1. **Focus First**: Always call 'focus_field' before asking about a field.
2. **One at a Time**: Never ask for two pieces of information in one turn.
3. **Validate & Update**: Call 'update_form_field' immediately after valid input is received.
4. **Be Concise**: Keep voice responses under 15 words. Avoid long explanations.
5. **No Hallucination**: If you don't know something or input is unclear, ask specifically.
6. **Explicit Submission**: Only call 'submit_form' after asking the user: "Should I submit the form for you?"
7. **JSON Types**: Ensure tool parameters match JSON types exactly (booleans as true/false).
`;
}

export default defineAgent({
  /* ---------------- PREWARM ---------------- */

  prewarm: async (proc: JobProcess) => {
    const vad = await silero.VAD.load({
      activationThreshold: 0.7,
      minSpeechDuration: 0.25,
    });

    proc.userData.vad = vad;
    // Pre-warm the LLM selection in background
    getMasterLlm().catch(console.error);
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
        if (!userHasConfirmed) return 'User confirmation required.';
        if (submitted) return 'Form already submitted.';

        submitted = true;
        await publishUpdate('form_submitted', { status: 'success' });
        return 'Form submitted successfully.';
      },
    });

    /* --------------------------- MODELS & SESSION ---------------------------- */

    const { llm, model } = await getMasterLlm();
    console.log(`🤖 [SESSION] Brain: ${model}`);

    const stt = new sarvam.STT({ model: 'saaras:v3', languageCode: 'unknown', flushSignal: true });
    const tts = new sarvam.TTS({ model: 'bulbul:v3', speaker: 'shubh', targetLanguageCode: 'en-IN', streaming: true });
    tts.setMaxListeners(0);

    const agent = new voice.Agent({
      instructions: buildInstructions(schema),
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
      vad: ctx.proc.userData.vad as silero.VAD,
      stt,
      llm,
      tts,
      turnHandling: {
        turnDetection: 'vad',
        endpointing: { minDelay: 0.4 }, // Human-like delay for administrative dictation
      },
    });

    /* ----------------------------- START FLOW -------------------------------- */

    await ctx.connect();
    await session.start({
      room: ctx.room,
      agent,
    });

    // Signal READINESS to UI
    if (ctx.room.localParticipant) {
      await ctx.room.localParticipant.setAttributes({ is_ready: 'true' });
    }

    const greet = () => {
      session.generateReply({
        instructions: `Welcome the user to the "${schema.title}" portal using the style of: ${GREETING_INSTRUCTIONS}`,
      });
    };

    if (ctx.room.remoteParticipants.size > 0) greet();
    ctx.room.on('participantConnected', greet);

    /* ---------- EVENTS ---------- */

    session.on(voice.AgentSessionEventTypes.Close, () => {
      console.log('Session closed');
    });

    session.on(voice.AgentSessionEventTypes.Error, (e: unknown) => {
      console.error('Session error:', e);
      publishUpdate('agent_error', {
        message: e instanceof Error ? e.message : 'Unexpected session failure',
      }).catch(console.error);
    });

    ctx.addShutdownCallback(async () => {
      if (ctx.room.localParticipant) {
        await ctx.room.localParticipant.setAttributes({ is_ready: 'false' });
      }
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
