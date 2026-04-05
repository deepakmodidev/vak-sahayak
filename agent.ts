import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as sarvam from '@livekit/agents-plugin-sarvam';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// ---------------------------------------------------------------------------
// 🎙️ Interview GPT - AI Mock Interviewer
// ---------------------------------------------------------------------------

export default defineAgent({
  // Prewarm: Load heavyweight resources like VAD before the job starts
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    console.log('--- 🚀 New Job Received (Dispatch Successful)! ---');
    console.log('--- Agent joining room:', ctx.room.name, '---');

    // 1. LLM (Brain): Groq (via OpenAI plugin)
    const llm = new openai.LLM({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    });

    // 2. STT (Ears): Sarvam AI for Hindi/English auto-detection
    const stt = new sarvam.STT({
      model: 'saaras:v3',
      languageCode: 'en-IN',
      flushSignal: true, // Behatar turn-taking ke liye
    });

    // 3. TTS (Mouth): Sarvam AI (Speaker: Shubh)
    const tts = new sarvam.TTS({
      model: 'bulbul:v3',
      speaker: 'shubh',
      targetLanguageCode: 'en-IN',
    });

    // 4. Connect to the room (First, so we can see metadata)
    await ctx.connect();
    console.log('Connected to room', ctx.room.name);

    // 5. Fetch Resume Context from Job Metadata (Official LiveKit Pattern)
    let resumeText = '';
    try {
      const jobMeta = JSON.parse(ctx.job.metadata || '{}');
      resumeText = jobMeta.resume || '';
      if (resumeText) {
        console.log(`--- 📄 Resume loaded from job metadata (${resumeText.length} chars) ---`);
      }
    } catch {
      console.warn('--- ⚠️ No job metadata found ---');
    }

    // 6. Agent Persona: Interview GPT (Personalized)
    const agent = new voice.Agent({
      instructions: `You are 'Interview GPT', a professional technical interviewer. 
      Your interview should follow this natural flow:
      
      1. Start with a professional greeting and 1-2 light warm-up questions (e.g., 'How are you?' or 'Can you tell me about your background?') to build rapport.
      2. Once the user is ready, transition into a technical deep-dive by asking exactly 4-5 targeted questions based on their resume. Ask exactly ONE question at a time and wait for a response.
      3. After the technical discussion is complete, provide a concise but constructive summary of the user's performance, highlighting their strengths and 1-2 specific areas for improvement.
      4. Finally, thank the user for their time and close the session gracefully.
      
      CORE RULES:
      - Always ask exactly one question (one-liner) at a time.
      - Maintain a professional, encouraging, and high technical standard throughout.
      - Keep your responses concise and conversational to ensure a natural flow.
      
      ### USER RESUME CONTEXT:
      ${resumeText}`,
    });

    // 5. Session: Orchestrates the interaction loop (Optimized for Fast Response)
    const session = new voice.AgentSession({
      stt,
      llm,
      tts,
      vad: ctx.proc.userData.vad as silero.VAD, // Local VAD mapping
      turnHandling: {
        turnDetection: 'vad', // Use local VAD for near-instant response
        endpointing: {
          minDelay: 0.5, // 500ms silence before bot starts thinking
        },
      },
    });

    // 6. Start the session
    await session.start({ agent, room: ctx.room });
    
    // Initial greeting triggered immediately
    session.generateReply({
      instructions: "Start by saying exactly: 'Hello, I am Interview GPT and I will conduct a mock interview based on your resume.' After that, ask a friendly warm-up question to build rapport.",
    });

    // --- Events & Feedback ---
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.isFinal) console.log('👤 User:', ev.transcript);
    });

    session.on(voice.AgentSessionEventTypes.Error, (err) => {
      console.error('⚠️ Session Error:', err);
    });
  },
});

// ---------------------------------------------------------------------------
// 🚀 CLI Runner (Fully Aligned with Official Docs)
// ---------------------------------------------------------------------------

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'interview-gpt',
  }),
);
