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
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load({
      activationThreshold: 0.7,
      minSpeechDuration: 0.25,
    });
  },

  entry: async (ctx: JobContext) => {
    // ✅ FIX 1: ctx.connect() moved to AFTER session.start()
    console.log(`🚀 Connecting to room: ${ctx.room.name} (Job: ${ctx.job.id})`);

    // --- 1. METADATA & SCHEMA INITIALIZATION ---
    let serviceType: string;
    try {
      const meta = JSON.parse(ctx.job.metadata || '{}');
      serviceType = meta.serviceType;

      if (!serviceType || !FORM_SCHEMAS[serviceType]) {
        throw new Error(`Missing or invalid serviceType: ${serviceType}`);
      }
    } catch (e) {
      throw new Error(`❌ Metadata validation failed: ${e instanceof Error ? e.message : e}`);
    }

    const currentSchema = FORM_SCHEMAS[serviceType];
    const fieldIdsRaw = currentSchema.fields.map((f) => f.id);
    if (fieldIdsRaw.length === 0) throw new Error(`Schema "${serviceType}" has no fields`);
    const fieldIds = fieldIdsRaw as [string, ...string[]];

    const publishUpdate = async (type: string, payload: any) => {
      const participant = ctx.room.localParticipant;
      if (!participant) throw new Error('Assistant disconnected');
      const message = JSON.stringify({ type, payload });
      await participant.publishData(encoder.encode(message), { reliable: true });
    };

    // --- 2. LLM TOOL DEFINITIONS ---
    const updateFormField = llmHelper.tool({
      description: 'Update a specific field in the government form.',
      parameters: z.object({
        field: z.enum(fieldIds),
        value: z.string(),
      }),
      execute: async ({ field, value }) => {
        console.log(`📝 Update: ${field} = ${value}`);
        try {
          await publishUpdate('form_update', { [field]: value });
          return `Successfully updated ${field} to ${value}.`;
        } catch (e) {
          console.warn(`⚠️ publishUpdate failed: ${e}`);
          return `Updated ${field} locally (sync failed).`;
        }
      },
    });

    const focusField = llmHelper.tool({
      description: 'Signal that you are about to ask for a specific field. Call BEFORE asking.',
      parameters: z.object({
        field: z.enum(fieldIds),
      }),
      execute: async ({ field }) => {
        console.log(`🎯 Focus: ${field}`);
        try {
          await publishUpdate('form_focus', { fieldId: field });
          return `UI focused on ${field}.`;
        } catch (e) {
          console.warn(`⚠️ publishUpdate failed: ${e}`);
          return `Focus shifted to ${field} locally.`;
        }
      },
    });

    let formSubmitted = false;
    const submitForm = llmHelper.tool({
      description:
        'Submit the final government form. Only call this AFTER the user has explicitly confirmed the summary.',
      parameters: z.object({
        userHasConfirmed: z
          .boolean()
          .describe('Must be explicitly true if the user confirmed the summary.'),
      }),
      execute: async ({ userHasConfirmed }) => {
        if (!userHasConfirmed) return 'You must ask the user to confirm first.';
        if (formSubmitted) return 'Error: Form already submitted.';

        formSubmitted = true;
        try {
          await publishUpdate('form_submitted', { status: 'success' });
          console.log(`✅ Form submitted successfully.`);
          return 'The form has been submitted and processed.';
        } catch (e) {
          console.warn(`⚠️ publishUpdate failed: ${e}`);
          return 'Form was processed but sync failed.';
        }
      },
    });

    // --- 3. MODEL INITIALIZATION ---
    const llm = new openai.LLM({
      model: 'llama-3.3-70b-versatile',
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const stt = new sarvam.STT({
      model: 'saaras:v3',
      languageCode: 'unknown',
      flushSignal: true,
    });

    const tts = new sarvam.TTS({
      model: 'bulbul:v3',
      speaker: 'shubh',
      targetLanguageCode: 'en-IN',
    });

    // 🚨 HACK: Intercept Sarvam TTS 408 before it reaches AgentSession
    const originalEmit = tts.emit.bind(tts);
    tts.emit = (eventName: string | symbol, ...args: any[]) => {
      if (eventName === 'error' || eventName === 'tts_error') {
        const err = args[0];
        if (err && err.toString().includes('408')) {
          console.log('🔇 Hacked: Silently swallowing Sarvam 408 idle timeout');
          return false;
        }
      }
      return originalEmit(eventName as any, ...args);
    };

    // --- 4. AGENT DEFINITION ---
    const agent = new voice.Agent({
      instructions: `
        # IDENTITY & PURPOSE
        You are "Vak Sahayak", a highly professional and empathetic AI assistant for Government of India forms. 
        Your current task is to help the user complete: ${currentSchema.title}.
        
        # STYLE & LANGUAGE
        - Use the SAME LANGUAGE as the user. If they speak Hindi, respond in Hindi. If they use English, respond in English.
        - Be concise. Do not use filler words.
        
        # MISSION
        Guide the user through the ${currentSchema.title} form.
        Description: ${currentSchema.description}
        
        # FIELDS TO COLLECT (STRICT ORDER)
        ${currentSchema.fields.map((f, i) => `${i + 1}. ${f.label} (${f.id})`).join('\n')}
        
        # OPERATING PROTOCOL
        1. FOCUS: Call 'focus_field' immediately before asking the user for a piece of information.
        2. ATOMICity: Ask for exactly one field at a time.
        3. DATA: Call 'update_form_field' as soon as the user provides a valid answer.
        4. SEQUENTIAL: Do not skip fields. Complete field N before moving to N+1.
        5. SUBMISSION: Once all fields are filled, provide a detailed summary of all information collected. Ask the user to verify the details and explicitly tell them to suggest any changes if needed. Only call 'submit_form' once the user gives a clear final confirmation to proceed.
        
        # CRITICAL: TOOL INTERFACE
        1. Use the provided tools via the JSON function calling schema ONLY.
        2. EXTREMELY IMPORTANT: DO NOT wrap function calls in <function=...> XML tags. 
        3. NEVER write "function=" in your text response to the user.
        4. If you write code or function calls in the chat, the user will hear them as nonsense.
        
        # NEVER HALLUCINATE DATA
        - DO NOT guess or use placeholders like "user_provided_value".
        - If you do not have the information for a field, you MUST ASK the user for it.
        - Only call 'update_form_field' when you have real, specific data from the user.
      `,
      tools: {
        update_form_field: updateFormField,
        focus_field: focusField,
        submit_form: submitForm,
      },
    });

    // ✅ FIX 2: vad accessed via ctx.proc directly
    const vad = ctx.proc.userData.vad! as silero.VAD;

    const session = new voice.AgentSession({
      stt,
      llm,
      tts,
      vad, // ✅ FIX 3: vad passed to session, not silero-less
      turnHandling: {
        turnDetection: 'vad', // ✅ FIX 4: 'stt' is invalid, use 'vad'
        endpointing: { minDelay: 0.07 },
      },
    });

    ctx.addShutdownCallback(async () => {
      console.log(`🛑 Job ${ctx.job.id} is shutting down...`);
    });

    // ✅ FIX 5: session.start() BEFORE ctx.connect()
    await session.start({ room: ctx.room, agent });
    await ctx.connect();
    console.log(`🚀 Connected to room: ${ctx.room.name}`);

    // --- 5. GREETING & EVENTS ---
    let greeted = false;

    const triggerGreeting = async () => {
      if (greeted) return;
      greeted = true;
      console.log(`👋 Greeting user for: ${currentSchema.title}`);
      // ✅ FIX 6: generateReply returns a handle, not a Promise — don't await
      session.generateReply({
        instructions: `Welcome the user warmly, introduce yourself as 'Vak Sahayak', and explain that you are newly active to assist with the ${currentSchema.title} form. Ask if they are ready to start.`,
      });
    };

    // ✅ FIX 7: .catch() on unhandled async calls
    if ([...ctx.room.remoteParticipants.values()].length > 0) {
      triggerGreeting().catch((e) => console.warn('⚠️ Greeting failed:', e));
    }
    ctx.room.on('participantConnected', () => {
      triggerGreeting().catch((e) => console.warn('⚠️ Greeting failed:', e));
    });

    tts.on('error', (e) => {
      if (e.toString().includes('408')) {
        console.log('💤 Sarvam TTS: Idle Sleep (408)');
      } else {
        console.warn('⚠️ TTS Warning:', e);
      }
    });

    llm.on('error', (e) => console.warn('⚠️ LLM Warning:', e));

    const SUPPORTED_TTS_LANGUAGES = [
      'bn-IN',
      'en-IN',
      'gu-IN',
      'hi-IN',
      'kn-IN',
      'ml-IN',
      'mr-IN',
      'od-IN',
      'pa-IN',
      'ta-IN',
      'te-IN',
    ];

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.isFinal) {
        console.log(`👤 User: ${ev.transcript}`);
        const detected = ev.language;
        if (detected && detected !== 'unknown' && SUPPORTED_TTS_LANGUAGES.includes(detected)) {
          console.log(`🌐 Switching agent voice to: ${detected}`);
          if (typeof (tts as any).updateOptions === 'function') {
            (tts as any).updateOptions({ targetLanguageCode: detected });
          } else {
            console.warn('⚠️ tts.updateOptions not supported on this plugin version');
          }
        }
      }
    });

    session.on(voice.AgentSessionEventTypes.Error, (e) => {
      if (e.toString().includes('408')) {
        console.log('💤 Session: Muffling Sarvam TTS 408 Idle Sleep error');
      } else {
        console.error('🚨 Session Error:', e);
      }
    });
  },
});

// Process-level stability
process.on('unhandledRejection', (reason) => {
  if (reason?.toString().includes('408')) {
    console.log('💤 Process: Muffling Unhandled Sarvam 408');
  } else {
    console.warn('⚠️ Global Unhandled Rejection:', reason);
  }
});

// ✅ FIX 8: Use fileURLToPath(import.meta.url) instead of process.argv[1]
cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'vak-sahayak',
    initializeProcessTimeout: 30_000,
  })
);
