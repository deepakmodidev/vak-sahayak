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

    // 4. Agent Persona: Interview GPT
    const agent = new voice.Agent({
      instructions: `You are 'Interview GPT', a professional and encouraging AI interviewer.
      Your goal is to conduct a mock interview with the user.
      
      CORE RULES:
      - Ask exactly ONE short, one-liner question at a time.
      - Never list multiple questions or ask double-barrelled questions.
      - Wait for the user to respond before asking the next question.
      - Keep your responses very brief and professional.
      
      FLOW:
      1. Start with a brief greeting and ask for their target role ONLY.
      2. Ask technical or behavioral questions one by one based on their input.
      3. After 3-5 rounds, provide a very short summary feedback and end the interview.`,
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
    
    // 7. Connect to the room (after session is ready)
    await ctx.connect();

    // Initial greeting triggered immediately
    session.generateReply({
      instructions: 'Introduce yourself as Interview GPT and ask the user which role they are practicing for today.',
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
