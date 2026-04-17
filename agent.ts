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

    // 1. Fetch Service Context from Job Metadata (Official Pattern)
    let serviceType = 'general';
    try {
      const jobMeta = JSON.parse(ctx.job.metadata || '{}');
      serviceType = jobMeta.serviceType || 'general';
      console.log(`--- 🛠️ Service Mode: ${serviceType.toUpperCase()} ---`);
    } catch {
      console.warn('--- ⚠️ No job metadata found, using general mode ---');
    }

    // 2. Defining Tools (using the renamed helper to avoid naming conflicts)
    const updateFormField = llmHelper.tool({
      description: 'Update a specific field in the government form.',
      parameters: z.object({
        field: z.enum(['full_name', 'age', 'address', 'id_number', 'service_type']).describe('The field to update'),
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

    const submitForm = llmHelper.tool({
      description: 'Submit the final government form after all details are collected.',
      parameters: z.object({
        confirmation: z.boolean().describe('Whether the user confirmed the submission'),
      }),
      execute: async ({ confirmation }: { confirmation: boolean }) => {
        if (!confirmation) return "Submission cancelled. Please confirm with the user first.";
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
      instructions: `You are 'Vak Sahayak', a dedicated and patient AI assistant for Indian citizens.
      
      CURRENT SERVICE MODE: ${serviceType.toUpperCase()}
      
      Your goal is to help users fill out the ${serviceType.toUpperCase()} form purely through voice.
      
      PERSONALITY:
      - Respected, professional, and helpful.
      - Use Hinglish (mix of Hindi and English).
      
      FLOW:
      1. Greet warmly. Since the user already selected ${serviceType.toUpperCase()} in the UI, start by acknowledging it (e.g., "Namaste! Main ${serviceType.toUpperCase()} form bharne mein aapki madad karunga.")
      2. Collect details one by one: Name, Age, Address, ID.
      3. Call 'update_form_field' immediately for every new piece of info.
      4. Once complete, summarize and ask for confirmation to submit.
      5. Call 'submit_form' when confirmed.
      
      CORE RULES:
      - Ask exactly ONE question at a time.
      - If the service is 'aadhaar', focus on address/name updates.
      - If the service is 'pan', focus on tax identity details.
      - If the service is 'ration', focus on family member details.`,
      tools: { update_form_field: updateFormField, submit_form: submitForm },
    });

    // 6. Session Orchestration (Exactly your pattern)
    const session = new voice.AgentSession({
      stt,
      llm,
      tts,
      vad: ctx.proc.userData.vad as silero.VAD,
      turnHandling: {
        turnDetection: 'vad',
        endpointing: {
          minDelay: 0.5,
        },
      },
    });

    // 7. Start Session
    await session.start({ agent, room: ctx.room });
    
    // 8. Greeting Orchestration (Exactly your pattern)
    const greet = async () => {
      console.log('--- 👋 Triggering Greeting... ---');
      session.generateReply({
        instructions: "Greet the user warmly in Hinglish with 'Namaste! Main Vak Sahayak hoon. Main aapki kaise madad kar sakta hoon?'",
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
