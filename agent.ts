import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
  llm as llmHelper, // Rename the helper here to keep your 'llm' variable clean
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as sarvam from '@livekit/agents-plugin-sarvam';
import * as silero from '@livekit/agents-plugin-silero';
import { config } from 'dotenv';

// Load environment variables from .env.local exactly
config({ path: '.env.local' });
import { z } from 'zod';
import { FORM_SCHEMAS, DEFAULT_SERVICE } from './lib/form-schemas';

/**
 * 🏛️ Vak Sahayak - AI Government Form Assistant
 * Structure adapted from Interview-GPT for maximum stability.
 */

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    const roomName = ctx.job.room?.name || "unknown";
    console.log(`--- 🚀 New Job Received (ID: ${ctx.job.id}) ---`);
    console.log(`--- Connecting to room: ${roomName} ---`);
    
    await ctx.connect();
    console.log(`--- ✅ Connected to room: ${ctx.room.name} ---`);

    // 1. Fetch Service Context Strictly (Fail Fast)
    console.log(`--- [DEBUG] Raw Job Metadata: ${ctx.job.metadata} ---`);
    
    if (!ctx.job.metadata) {
      throw new Error("❌ FAILED FAST: Job metadata is completely empty. Cannot determine service type.");
    }

    const jobMeta = JSON.parse(ctx.job.metadata);
    const serviceType = jobMeta.serviceType;

    if (!serviceType) {
      throw new Error("❌ FAILED FAST: 'serviceType' is missing from Job Metadata.");
    }

    if (!FORM_SCHEMAS[serviceType]) {
      throw new Error(`❌ FAILED FAST: Unknown service type requested: '${serviceType}'.`);
    }

    console.log(`--- ✅ [${ctx.job.id}] Service Type Detected: ${serviceType} ---`);
    console.log(`--- 🛠️ Service Mode: ${serviceType.toUpperCase()} ---`);

    const currentSchema = FORM_SCHEMAS[serviceType];
    const fieldIds = currentSchema.fields.map(f => f.id) as [string, ...string[]];

    // 2. Defining Tools (using the renamed helper to avoid naming conflicts)
    const updateFormField = llmHelper.tool({
      description: 'Update a specific field in the government form.',
      parameters: z.object({
        field: z.enum(fieldIds).describe('The field to update'),
        value: z.string().describe('The information provided by the user'),
      }),
      execute: async ({ field, value }: { field: string; value: string }) => {
        console.log(`--- 📝 [${serviceType}] Form Update: ${field} = ${value} ---`);
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ 
          type: 'form_update', 
          payload: { [field]: value } 
        }));
        await ctx.room.localParticipant?.publishData(data, { reliable: true });
        return `Successfully updated ${field} to ${value}.`;
      },
    });

    const focusField = llmHelper.tool({
      description: 'Signal that you are about to ask the user for a specific field. Call this BEFORE asking.',
      parameters: z.object({
        field: z.enum(fieldIds).describe('The field you are about to focus on'),
      }),
      execute: async ({ field }: { field: string }) => {
        console.log(`--- 🎯 [${serviceType}] Focus: ${field} ---`);
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ 
          type: 'form_focus', 
          payload: { fieldId: field } 
        }));
        await ctx.room.localParticipant?.publishData(data, { reliable: true });
        return `UI focused on ${field}. You can now ask the question.`;
      },
    });

    const submitForm = llmHelper.tool({
      description: 'Submit the final government form after all details are collected.',
      parameters: z.object({
        confirmation: z.union([z.boolean(), z.string()]).describe('Whether the user confirmed the submission (accepts true/false or "true"/"false")'),
      }),
      execute: async ({ confirmation }: { confirmation: boolean | string }) => {
        const isConfirmed = confirmation === true || confirmation === 'true';
        if (!isConfirmed) return "Submission cancelled. Please confirm with the user first.";
        console.log(`--- ✅ [${serviceType}] Form Submitted Successfully ---`);
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'form_submitted', payload: { status: 'success' } }));
        await ctx.room.localParticipant?.publishData(data, { reliable: true });
        return "The form has been submitted successfully to the portal.";
      },
    });

    // 3. LLM: Groq (Exactly your pattern)
    const llm = new openai.LLM({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
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

    // 6. Agent Instructions (Re-populated for Vak Sahayak with Dynamic Service)
    const agent = new voice.Agent({
      instructions: `You are 'Vak Sahayak', a dedicated and patient AI assistant for Indian citizens helping with government forms.
      
      CURRENT SERVICE: ${currentSchema.title}
      DESCRIPTION: ${currentSchema.description}
      
      CORE INSTRUCTIONS:
      ${currentSchema.instructions}
      
      RELEVANT FIELDS TO COLLECT:
      ${currentSchema.fields.map(f => `- ${f.label} (${f.id})`).join('\n')}

      PERSONALITY:
      - Respected, professional, and helpful.
      - Use Hinglish (mix of Hindi and English).
      
      CORE RULES:
      1. FOCUS BEFORE ASKING: You MUST call 'focus_field' for a specific field BEFORE you ask the user about it. This allows the UI to scroll and show the field in advance.
      2. STRICT SEQUENTIAL ORDER: You MUST collect information in the exact order listed below. Do NOT skip any field.
      3. NO ASSUMPTIONS: If a field is empty, you MUST ask for it. Even if information was partially provided, verify and fill every individual field ID.
      4. ONE AT A TIME: Ask exactly ONE question at a time.
      5. FILL IMMEDIATELY: As soon as the user provides an answer, call 'update_form_field'.
      6. MANDATORY CONFIRMATION: Once ALL fields are filled, you MUST explicitly ask the user for permission to submit the form (e.g. "Saari jaankari mil gayi hai, kya main form submit kar doon?"). You may ONLY call 'submit_form' AFTER the user explicitly says YES or GIVES PERMISSION to submit.
      
      CRITICAL: Always check the current form state. If 'RELATION (F/H)' (relation_type) is empty, you must NOT move on to 'FATHER/SPOUSE' until it is filled.`,
      tools: { update_form_field: updateFormField, focus_field: focusField, submit_form: submitForm },
    });

    // 6. Session Orchestration (Hardened for stability)
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

    // 7. Start Session
    await session.start({ agent, room: ctx.room });
    
    // 8. Greeting Orchestration (Exactly your pattern)
    const greet = async () => {
      console.log(`--- 👋 Triggering Greeting for ${currentSchema.title}... ---`);
      session.generateReply({
        instructions: `Greet the user warmly in Hinglish with 'Namaste! Main Vak Sahayak hoon. Main aaj aapki ${currentSchema.title} application bharne mein madad karunga. Shuru karein?'`,
      });
    };

    // If a human is already here, greet immediately. Otherwise, wait for someone.
    const humanParticipants = ctx.room.remoteParticipants.values();
    if (Array.from(humanParticipants).length > 0) {
      greet();
    } else {
      ctx.room.on('participantConnected', () => {
        console.log('--- 👤 Participant connected, greeting... ---');
        greet();
      });
    }

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.isFinal) console.log('👤 User:', ev.transcript);
    });

    session.on(voice.AgentSessionEventTypes.Error, (err) => {
      console.error('⚠️ Session Error:', err);
    });
  },
});

// 🚀 CLI Runner (Fully Aligned)
cli.runApp(
  new ServerOptions({
    agent: process.argv[1],
    agentName: 'vak-sahayak',
  }),
);
