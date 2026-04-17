import { config } from 'dotenv';
import { z } from 'zod';
import { type JobContext, type JobProcess, ServerOptions, cli, defineAgent, llm as llmHelper, voice } from '@livekit/agents';
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
      minSpeechDuration: 0.25 
    }); 
  },

  entry: async (ctx: JobContext) => {
    await ctx.connect();
    console.log(`🚀 Connected to room: ${ctx.room.name} (Job: ${ctx.job.id})`);

    // --- 1. METADATA & SCHEMA INITIALIZATION ---
    let serviceType: string;
    try {
      const meta = JSON.parse(ctx.job.metadata || '{}');
      serviceType = meta.serviceType;

      if (!serviceType || !FORM_SCHEMAS[serviceType]) {
        throw new Error(`Missing or invalid serviceType: ${serviceType}`);
      }
    } catch (e) {
      throw new Error(`❌ Metadata validation failed: ${e}`);
    }

    const currentSchema = FORM_SCHEMAS[serviceType];
    const fieldIds = currentSchema.fields.map((f) => f.id) as [string, ...string[]];

    /**
     * Internal helper to publish JSON data to the frontend participant.
     */
    const publishUpdate = async (type: string, payload: any) => {
      const participant = ctx.room.localParticipant;
      if (!participant) return 'Error: Assistant disconnected.';
      
      const message = JSON.stringify({ type, payload });
      await participant.publishData(encoder.encode(message), { reliable: true });
    };

    // --- 2. LLM TOOL DEFINITIONS ---
    const updateFormField = llmHelper.tool({
      description: 'Update a specific field in the government form.',
      parameters: z.object({ 
        field: z.enum(fieldIds), 
        value: z.string() 
      }),
      execute: async ({ field, value }) => {
        console.log(`📝 Update: ${field} = ${value}`);
        await publishUpdate('form_update', { [field]: value });
        return `Successfully updated ${field} to ${value}.`;
      },
    });

    const focusField = llmHelper.tool({
      description: 'Signal that you are about to ask for a specific field. Call BEFORE asking.',
      parameters: z.object({ 
        field: z.enum(fieldIds) 
      }),
      execute: async ({ field }) => {
        console.log(`🎯 Focus: ${field}`);
        await publishUpdate('form_focus', { fieldId: field });
        return `UI focused on ${field}.`;
      },
    });

    let formSubmitted = false;
    const submitForm = llmHelper.tool({
      description: 'Submit the final government form once all confirmed.',
      parameters: z.object({ 
        confirmation: z.string() 
      }),
      execute: async ({ confirmation }) => {
        if (formSubmitted) return 'Error: Form already submitted.';
        
        const ok = ['yes', 'true', 'confirm', 'karo', 'ha', 'submit'].some(w => 
          confirmation.toLowerCase().includes(w)
        );

        if (!ok) return 'Submission cancelled. Please wait for user confirmation.';
        
        formSubmitted = true;
        await publishUpdate('form_submitted', { status: 'success' });
        console.log(`✅ Form submitted successfully.`);
        return 'The form has been submitted and processed.';
      },
    });

    // --- 3. MODEL INITIALIZATION ---
    const llm = new openai.LLM({
      model: 'llama-3.3-70b-versatile',
      // model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const stt = new sarvam.STT({ 
      model: 'saaras:v3', 
      languageCode: 'unknown', // Detects any language automatically
      flushSignal: true 
    });

    const tts = new sarvam.TTS({ 
      model: 'bulbul:v3', 
      speaker: 'shubh', 
      targetLanguageCode: 'en-IN' // Initial greeting language
    });

    // --- 4. AGENT DEFINITION ---
    const agent = new voice.Agent({
      llm,
      stt,
      tts,
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
        1. Use the provided tools via the API schema ONLY.
        2. NEVER write "function=" or tools in your text response to the user.
        3. If you write code or function calls in the chat, the user will hear them as nonsense.
        
        # NEVER HALLUCINATE DATA
        - DO NOT guess or use placeholders like "user_provided_value".
        - If you do not have the information for a field, you MUST ASK the user for it.
        - Only call 'update_form_field' when you have real, specific data from the user.
      `,
      tools: { 
        update_form_field: updateFormField, 
        focus_field: focusField, 
        submit_form: submitForm 
      },
    });

    const session = new voice.AgentSession({
      stt, llm, tts, 
      vad: ctx.proc.userData.vad as silero.VAD,
      turnHandling: { 
        turnDetection: 'vad', 
        endpointing: { minDelay: 0.8 } 
      },
    });

    // Cleanup resources on shutdown
    ctx.addShutdownCallback(async () => {
      console.log(`🛑 Job ${ctx.job.id} is shutting down...`);
    });

    await session.start({ agent, room: ctx.room });

    // --- 5. GREETING & EVENTS ---
    let greeted = false;

    const triggerGreeting = () => {
      if (greeted) return;
      greeted = true;
      console.log(`👋 Greeting user for: ${currentSchema.title}`);
      session.generateReply({ 
        instructions: `Welcome the user warmly, introduce yourself as 'Vak Sahayak', and explain that you are here to assist with the ${currentSchema.title} form. Ask if they are ready to start.` 
      });
    };

    // Greet immediately if participants exist, otherwise wait for join
    if (ctx.room.remoteParticipants.size > 0) triggerGreeting();
    ctx.room.on('participantConnected', triggerGreeting);

    // Error & Telemetry Management
    tts.on('error', (e) => {
      if (e.toString().includes('408')) {
        console.log('💤 Sarvam TTS: Idle Sleep (408)'); // Standard idle behavior
      } else {
        console.warn('⚠️ TTS Warning:', e);
      }
    });
    
    llm.on('error', (e) => console.warn('⚠️ LLM Warning:', e));
    
    // Dynamic Language Switching Logic
    const SUPPORTED_TTS_LANGUAGES = ['bn-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'];
    
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.isFinal) {
        console.log(`👤 User: ${ev.transcript}`);
        
        // Update TTS language if a new regional language is detected
        const detected = ev.language;
        if (detected && detected !== 'unknown' && SUPPORTED_TTS_LANGUAGES.includes(detected)) {
          console.log(`🌐 Switching agent voice to: ${detected}`);
          tts.updateOptions({ targetLanguageCode: detected });
        }
      }
    });

    session.on(voice.AgentSessionEventTypes.Error, (e) => {
      // Ignore Sarvam 408 errors as they are non-fatal idle signals
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
  // Suppress Sarvam 408 errors that leak out of the plugin's async blocks
  if (reason?.toString().includes('408')) {
    console.log('💤 Process: Muffling Unhandled Sarvam 408');
  } else {
    console.warn('⚠️ Global Unhandled Rejection:', reason);
  }
});

// Start the CLI Runner
cli.runApp(new ServerOptions({
  agent: process.argv[1],
  agentName: 'vak-sahayak',
  initializeProcessTimeout: 30_000,
}));
