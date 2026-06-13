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
import { FORM_SCHEMAS, type FormSchema } from './lib/form-schemas';

config({ path: '.env.local' });

const encoder = new TextEncoder();
const PROBE_TIMEOUT_MS = 6_000; // max time a model may take to yield its first token while probing
const GREETING = `Greet the user warmly as "Vak Sahayak". Ask if they are ready to begin. Keep it brief and professional.`;

// ────────────────────────────── LLM selection ──────────────────────────────

// Memoize the probe PROMISE (not result) so concurrent callers share one in-flight
// probe; clear it on failure so a later job can retry instead of caching a rejection.
let masterLlmPromise: Promise<{ llm: openai.LLM; model: string }> | null = null;

function getMasterLlm(): Promise<{ llm: openai.LLM; model: string }> {
  if (!masterLlmPromise) {
    masterLlmPromise = probeMasterLlm().catch((err: unknown) => {
      masterLlmPromise = null;
      throw err;
    });
  }
  return masterLlmPromise;
}

/** Healthy iff the model yields a content token within the timeout. */
async function probeModel(candidate: openai.LLM): Promise<void> {
  const testCtx = llmHelper.ChatContext.empty();
  testCtx.addMessage({ role: 'user', content: 'say ok' });
  const stream = candidate.chat({ chatCtx: testCtx });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`probe exceeded ${PROBE_TIMEOUT_MS}ms`)), PROBE_TIMEOUT_MS);
  });
  const consume = async (): Promise<void> => {
    for await (const chunk of stream) if (chunk.delta?.content) return;
    throw new Error('Model produced no content');
  };

  const consumePromise = consume();
  try {
    await Promise.race([consumePromise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
    consumePromise.catch(() => {}); // swallow a late rejection if the timeout won
    try {
      stream.close(); // release the SSE socket (the for-await never finishes on timeout)
    } catch {
      /* already closed */
    }
  }
}

async function probeMasterLlm(): Promise<{ llm: openai.LLM; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
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
      const candidate = new openai.LLM({ model, baseURL: 'https://api.groq.com/openai/v1', apiKey });
      await probeModel(candidate);
      console.log(`✅ [INFRA] Master LLM selected: ${model}`);
      return { llm: candidate, model };
    } catch (e) {
      console.warn(`⚠️ [INFRA] ${model} probe failed: ${(e as Error).message}`);
    }
  }
  throw new Error('FAILED_FAST: No healthy LLM found in chain.');
}

function buildInstructions(schema: FormSchema) {
  return `You are Vak Sahayak, a concise voice assistant filling the "${schema.title}".

Collect these fields IN ORDER, one per turn:
${schema.fields.map((f, i) => `${i + 1}. ${f.label} (${f.id})`).join('\n')}

- Call focus_field before asking a field; update_form_field after the user answers.
- One question per turn, replies under 15 words, never invent values.
- When all fields are filled, call request_submit, then follow its returned instructions exactly.
- Tool replies are short instructions — always follow them.`;
}

// ──────────────────────────── Form state machine ───────────────────────────
// GREETING → COLLECTING → REVIEW → SUBMITTED. `phase` gates which tools may fire;
// `cursor` enforces field order (update rejects any field past it). A correction
// in REVIEW returns to COLLECTING, forcing a fresh request_submit (re-readback).

type Phase = 'greeting' | 'collecting' | 'review' | 'submitted';

const ALLOWED_TRANSITIONS: Record<Phase, readonly Phase[]> = {
  greeting: ['collecting'],
  collecting: ['review'],
  review: ['collecting', 'submitted'],
  submitted: [],
};

type PublishFn = (type: string, payload: unknown) => Promise<void>;

interface FormMachine {
  readonly tools: llmHelper.ToolContext; // pass straight to voice.Agent
  phase(): Phase;
  markGreeted(): void; // GREETING → COLLECTING once the greeting is delivered
  noteUserTurn(): void; // record a finalized user utterance (drives the confirmation gate)
}

function createFormMachine(schema: FormSchema, publish: PublishFn): FormMachine {
  const fields = schema.fields;
  if (fields.length === 0) throw new Error('Schema has no fields.');
  const fieldIds = fields.map((f) => f.id) as [string, ...string[]];
  const indexOf = new Map(fields.map((f, i) => [f.id, i] as const));

  let phase: Phase = 'greeting';
  let cursor = 0; // next field expected in order
  let userTurns = 0; // finalized user utterances
  let armedAtTurn = -1; // userTurns when REVIEW was entered
  const values: Record<string, string> = {};

  const transition = (to: Phase): boolean => {
    if (!ALLOWED_TRANSITIONS[phase].includes(to)) {
      console.warn(`[FSM] illegal transition ${phase} → ${to} ignored`);
      return false;
    }
    console.log(`[FSM] ${phase} → ${to}`);
    phase = to;
    return true;
  };

  const focusField = llmHelper.tool({
    description: 'Focus a field before asking about it.',
    parameters: z.object({ field: z.enum(fieldIds) }),
    execute: async ({ field }) => {
      if (phase === 'submitted') return 'already submitted';
      if (indexOf.get(field)! > cursor) return `collect ${fields[cursor].label} first`;
      await publish('form_focus', { fieldId: field });
      return 'ok';
    },
  });

  const updateField = llmHelper.tool({
    description: "Save the user's answer to a field.",
    parameters: z.object({ field: z.enum(fieldIds), value: z.string().max(500) }),
    execute: async ({ field, value }) => {
      if (phase === 'submitted') return 'already submitted';
      if (!value.trim()) return 'value is empty — ask the user for it again';
      const idx = indexOf.get(field)!;
      if (idx > cursor) return `BLOCKED: fill ${fields[cursor].label} first (in order)`;

      values[field] = value;
      await publish('form_update', { [field]: value });

      if (phase === 'review') transition('collecting'); // correction → re-readback before submit
      if (idx === cursor) while (cursor < fields.length && values[fields[cursor].id]) cursor += 1;

      return cursor < fields.length
        ? `saved; next: ${fields[cursor].label}`
        : 'saved; all fields done — call request_submit';
    },
  });

  const requestSubmit = llmHelper.tool({
    description: 'Call when all fields are filled. Returns a summary to read back. Does NOT submit.',
    parameters: z.object({}),
    execute: async () => {
      if (phase === 'submitted') return 'already submitted';
      const missing = fields.filter((f) => !values[f.id]);
      if (missing.length > 0) return `NOT READY — empty: ${missing.map((f) => f.label).join(', ')}`;

      // Arm only on first entry to review; re-calling in review must not reset the gate.
      if (phase === 'collecting') {
        transition('review');
        armedAtTurn = userTurns;
      }
      const readback = fields.map((f) => `${f.label}: ${values[f.id]}`).join('; ');
      return `ARMED. Read back, then ask "Submit?": ${readback}`;
    },
  });

  const submitForm = llmHelper.tool({
    description: 'Submit the form. Use only after request_submit and the user has replied.',
    // String enum, not boolean: small LLMs emit booleans as the string "true", which the provider rejects.
    parameters: z.object({
      confirmation: z.enum(['yes', 'no']).describe("'yes' if the user agreed to submit, else 'no'"),
    }),
    execute: async ({ confirmation }) => {
      if (phase === 'submitted') return 'already submitted';
      if (phase !== 'review') return 'BLOCKED: call request_submit first';
      if (userTurns <= armedAtTurn) return 'BLOCKED: wait for the user to answer first';
      if (confirmation !== 'yes') return 'user did not confirm — do not submit';

      // Publish before transitioning, so a publish failure leaves us in review to retry.
      try {
        await publish('form_submitted', { status: 'success' });
      } catch {
        return 'could not submit just now — please try again';
      }
      transition('submitted');
      return 'submitted; thank the user, they may end the call';
    },
  });

  return {
    tools: { focus_field: focusField, update_form_field: updateField, request_submit: requestSubmit, submit_form: submitForm },
    phase: () => phase,
    markGreeted: () => {
      if (phase === 'greeting') transition('collecting');
    },
    noteUserTurn: () => {
      userTurns += 1;
    },
  };
}

// ─────────────────────────────────── Agent ─────────────────────────────────

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load({ activationThreshold: 0.7, minSpeechDuration: 0.25 });
    getMasterLlm().catch(console.error); // warm the LLM selection in the background
  },

  entry: async (ctx: JobContext) => {
    let metadata: { serviceType?: string } = {};
    try {
      metadata = JSON.parse(ctx.job.metadata ?? '{}');
    } catch {
      console.warn('⚠️ [ENTRY] Malformed job metadata; using empty defaults.');
    }
    const schema = metadata.serviceType ? FORM_SCHEMAS[metadata.serviceType] : undefined;
    if (!schema) throw new Error(`Invalid serviceType: ${metadata.serviceType}`);

    const publishUpdate: PublishFn = async (type, payload) => {
      const p = ctx.room.localParticipant;
      if (!p) return;
      await p.publishData(encoder.encode(JSON.stringify({ type, payload })), { reliable: true });
    };

    const machine = createFormMachine(schema, publishUpdate);

    // Connect before selecting the LLM, so a model-selection failure can reach the UI
    // instead of leaving the client hanging.
    await ctx.connect();

    let llm: openai.LLM;
    let model: string;
    try {
      ({ llm, model } = await getMasterLlm());
    } catch (err) {
      await publishUpdate('agent_error', {
        message: 'No language model is available right now. Please try again shortly.',
      }).catch(() => {});
      throw err;
    }
    console.log(`🤖 [SESSION] Brain: ${model}`);

    const stt = new sarvam.STT({ model: 'saaras:v3', languageCode: 'unknown', flushSignal: true });
    // Non-streaming: the streaming WS 408s during conversation gaps and tears the session down.
    const tts = new sarvam.TTS({ model: 'bulbul:v3', speaker: 'shubh', targetLanguageCode: 'en-IN', streaming: false });
    tts.setMaxListeners(0); // the per-turn StreamAdapter listeners exceed the default over a long form
    // Absorb TTS 'error' events so a transient Sarvam hiccup can't crash the process (ERR_UNHANDLED_ERROR).
    tts.on('error', (e: unknown) => console.error('⚠️ [TTS] non-fatal error:', e instanceof Error ? e.message : e));

    const vad = ctx.proc.userData.vad as silero.VAD | undefined;
    if (!vad) throw new Error('VAD not initialized');

    const agent = new voice.Agent({ instructions: buildInstructions(schema), tools: machine.tools });
    const session = new voice.AgentSession({
      vad,
      stt,
      llm,
      tts,
      turnHandling: { turnDetection: 'vad', endpointing: { minDelay: 0.4 } },
    });

    // Events registered before start, to not miss early ones.
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.isFinal) machine.noteUserTurn();
    });
    session.on(voice.AgentSessionEventTypes.Close, () => console.log('Session closed'));
    session.on(voice.AgentSessionEventTypes.Error, (ev: unknown) => {
      console.error('Session error:', ev);
      if (machine.phase() === 'submitted') return; // benign teardown after a successful submit
      // TTS hiccups recover on their own — log, don't alarm the user.
      const e = ev as { error?: { type?: string }; source?: { label?: string } };
      if ((e?.source?.label ?? '').includes('TTS') || e?.error?.type === 'tts_error') return;
      const inner = e?.error ?? ev;
      const message =
        inner instanceof Error ? inner.message
        : typeof inner === 'string' ? inner
        : ((inner as { message?: string })?.message ?? 'The voice service hit an error.');
      publishUpdate('agent_error', { message }).catch(console.error);
    });

    await session.start({ room: ctx.room, agent });

    // Wire the greeting (once) BEFORE announcing readiness, so the UI never flips to an
    // active session that then sits silent because greet wasn't wired yet.
    let greeted = false;
    const greet = () => {
      if (greeted) return;
      greeted = true;
      ctx.room.off('participantConnected', greet);
      machine.markGreeted();
      session.generateReply({ instructions: `Welcome the user to the "${schema.title}" portal: ${GREETING}` });
    };
    if (ctx.room.remoteParticipants.size > 0) greet();
    ctx.room.on('participantConnected', greet);

    if (ctx.room.localParticipant) await ctx.room.localParticipant.setAttributes({ is_ready: 'true' });

    ctx.addShutdownCallback(async () => {
      ctx.room.off('participantConnected', greet);
      if (ctx.room.localParticipant)
        await ctx.room.localParticipant.setAttributes({ is_ready: 'false' }).catch(() => {});
      await session.close().catch(() => {});
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'vak-sahayak',
    initializeProcessTimeout: 30_000,
  })
);
