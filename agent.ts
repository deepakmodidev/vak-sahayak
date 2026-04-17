import { config } from 'dotenv';
import { z } from 'zod';
import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  llm as llmHelper,
  // Rename the helper here to keep your 'llm' variable clean
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as sarvam from '@livekit/agents-plugin-sarvam';
import * as silero from '@livekit/agents-plugin-silero';
import { FORM_SCHEMAS } from './lib/form-schemas';

config({ path: '.env.local' });

/**
 * 🏛️ Vak Sahayak - AI Government Form Assistant
 * Structure adapted from Interview-GPT for maximum stability.
 */

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    const roomName = ctx.job.room?.name || 'unknown';
    console.log(`--- 🚀 New Job Received (ID: ${ctx.job.id}) ---`);
    console.log(`--- Connecting to room: ${roomName} ---`);

    await ctx.connect();
    console.log(`--- ✅ Connected to room: ${ctx.room.name} ---`);

    // 1. Fetch Service Context Strictly (Fail Fast)
    if (!ctx.job.metadata) throw new Error('❌ FAILED FAST: Job metadata is completely empty.');

    let jobMeta: { serviceType?: string; branding?: string };
    try {
      jobMeta = JSON.parse(ctx.job.metadata);
    } catch {
      throw new Error('❌ FAILED FAST: Job metadata is not valid JSON.');
    }

    const { serviceType } = jobMeta;
    if (!serviceType)
      throw new Error("❌ FAILED FAST: 'serviceType' is missing from Job Metadata.");
    if (!FORM_SCHEMAS[serviceType])
      throw new Error(`❌ FAILED FAST: Unknown service type: '${serviceType}'.`);

    console.log(`--- ✅ [${ctx.job.id}] Service Mode: ${serviceType.toUpperCase()} ---`);

    const currentSchema = FORM_SCHEMAS[serviceType];
    const fieldIds = currentSchema.fields.map((f) => f.id) as [string, ...string[]];
    const encoder = new TextEncoder();

    // 2. Defining Tools
    const updateFormField = llmHelper.tool({
      description: 'Update a specific field in the government form.',
      parameters: z.object({
        field: z.enum(fieldIds).describe('The field to update'),
        value: z.string().describe('The information provided by the user'),
      }),
      execute: async ({ field, value }: { field: string; value: string }) => {
        console.log(`--- 📝 [${serviceType}] Update: ${field} = ${value} ---`);
        const participant = ctx.room.localParticipant;
        if (!participant)
          return 'Error: Could not update the form as the assistant is disconnected.';

        await participant.publishData(
          encoder.encode(JSON.stringify({ type: 'form_update', payload: { [field]: value } })),
          { reliable: true }
        );
        return `Successfully updated ${field} to ${value}.`;
      },
    });

    const focusField = llmHelper.tool({
      description:
        'Signal that you are about to ask the user for a specific field. Call this BEFORE asking.',
      parameters: z.object({
        field: z.enum(fieldIds).describe('The field you are about to focus on'),
      }),
      execute: async ({ field }: { field: string }) => {
        console.log(`--- 🎯 [${serviceType}] Focus: ${field} ---`);
        const participant = ctx.room.localParticipant;
        if (!participant)
          return 'Error: Could not focus the form as the assistant is disconnected.';

        await participant.publishData(
          encoder.encode(JSON.stringify({ type: 'form_focus', payload: { fieldId: field } })),
          { reliable: true }
        );
        return `UI focused on ${field}. You can now ask the question.`;
      },
    });

    let formSubmitted = false;
    const submitForm = llmHelper.tool({
      description: 'Submit the final government form after all details are collected.',
      parameters: z.object({
        confirmation: z
          .union([z.boolean(), z.string()])
          .describe('Whether the user confirmed the submission'),
      }),
      execute: async ({ confirmation }: { confirmation: boolean | string }) => {
        if (formSubmitted) return 'The form has already been submitted. No further action needed.';
        if (confirmation !== true && confirmation !== 'true')
          return 'Submission cancelled. Please confirm with the user first.';

        const participant = ctx.room.localParticipant;
        if (!participant)
          return 'Error: Could not submit the form as the assistant is disconnected.';

        formSubmitted = true;
        console.log(`--- ✅ [${serviceType}] Form Submitted Successfully ---`);
        await participant.publishData(
          encoder.encode(
            JSON.stringify({ type: 'form_submitted', payload: { status: 'success' } })
          ),
          { reliable: true }
        );
        return 'The form has been submitted successfully to the portal.';
      },
    });

    // 3. LLM: Groq
    const llm = new openai.LLM({
      model: 'llama-3.3-70b-versatile', // stable and production ready
      // model: 'meta-llama/llama-4-scout-17b-16e-instruct', // latest but preview
      baseURL: 'https://api.groq.com/openai/v1',
    });

    // 4. STT: Sarvam Saaras v3
    const stt = new sarvam.STT({
      model: 'saaras:v3',
      languageCode: 'en-IN',
      flushSignal: true,
    });

    // 5. TTS: Sarvam Bulbul v3 (Speaker: Shubh)
    const tts = new sarvam.TTS({
      model: 'bulbul:v3',
      speaker: 'shubh',
      targetLanguageCode: 'en-IN',
    });

    // 6. Agent Instructions
    const orderedFields = currentSchema.fields.map(
      (f, i) => `${i + 1}. ${f.label} — field_id: "${f.id}"`
    );
    const agent = new voice.Agent({
      instructions: `You are 'Vak Sahayak', a dedicated and patient AI assistant for Indian citizens helping with government forms.

      CURRENT SERVICE: ${currentSchema.title}
      DESCRIPTION: ${currentSchema.description}

      CORE INSTRUCTIONS:
      ${currentSchema.instructions}

      FIELDS TO COLLECT — IN THIS EXACT ORDER, NO EXCEPTIONS:
      ${orderedFields.join('\n')}

      PERSONALITY:
      - Respected, professional, and helpful.
      - Use Hinglish (mix of Hindi and English).

      STRICT RULES:
      1. FOCUS FIRST: Call 'focus_field' with the field_id BEFORE asking the user for that field.
      2. ONE AT A TIME: Ask for exactly ONE field at a time. Never combine questions.
      3. FILL IMMEDIATELY: The moment the user answers, call 'update_form_field' before moving to the next field.
      4. BLOCKING RULE — NO SKIPPING: You MUST complete field N before asking for field N+1. If field N is still empty (user has not answered), you MUST re-ask field N. You are NOT allowed to proceed to the next field until 'update_form_field' has been successfully called for the current field.
      5. NO ASSUMPTIONS: Never assume or infer a field value. If the user did not directly state it, ask again.
      6. SUBMIT ONLY WITH PERMISSION: Once ALL fields are filled, ask "Saari jaankari sahi hai, kya main form submit kar doon?" and only call 'submit_form' after the user explicitly says YES.`,
      tools: {
        update_form_field: updateFormField,
        focus_field: focusField,
        submit_form: submitForm,
      },
    });

    // 7. Session Orchestration (Hardened for stability)
    const session = new voice.AgentSession({
      stt,
      llm,
      tts,
      vad: ctx.proc.userData.vad as silero.VAD,
      turnHandling: {
        turnDetection: 'vad',
        endpointing: {
          minDelay: 0.8, // Increased from 0.5s to 0.8s to prevent aggressive interruptions
        },
      },
    });

    // 8. Start Session
    await session.start({ agent, room: ctx.room });

    // 9. Greeting Orchestration (Exactly your pattern)
    const greet = async () => {
      console.log(`--- 👋 Triggering Greeting for ${currentSchema.title}... ---`);
      session.generateReply({
        instructions: `Greet the user warmly in Hinglish with 'Namaste! Main Vak Sahayak hoon. Main aaj aapki ${currentSchema.title} application bharne mein madad karunga. Shuru karein?'`,
      });
    };

    // If a human is already here, greet immediately. Otherwise, wait for someone.
    let greeted = false;
    const greetOnce = () => {
      if (greeted) return;
      greeted = true;
      greet();
    };

    if (ctx.room.remoteParticipants.size > 0) {
      greetOnce();
    } else {
      ctx.room.on('participantConnected', () => {
        console.log('--- 👤 Participant connected, greeting... ---');
        greetOnce();
      });
    }

    // Catch errors on source emitters to prevent ERR_UNHANDLED_ERROR crashes
    tts.on('error', (err) => {
      console.warn('⚠️ TTS Error (caught):', err);
    });
    llm.on('error', (err) => {
      console.warn('⚠️ LLM Error (caught):', err);
    });

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.isFinal) console.log('👤 User:', ev.transcript);
    });

    session.on(voice.AgentSessionEventTypes.Error, (err) => {
      console.error('⚠️ Session Error:', err);
    });
  },
});

// Catch leaked promise rejections from pipeline internals
process.on('unhandledRejection', (reason) => {
  console.warn(
    '⚠️ Unhandled Rejection (caught):',
    reason instanceof Error ? reason.message : reason
  );
});

// 🚀 CLI Runner
cli.runApp(
  new ServerOptions({
    agent: process.argv[1],
    agentName: 'vak-sahayak',
    initializeProcessTimeout: 30_000, // 30s for Windows cold starts
  })
);
