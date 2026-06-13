# Vak Sahayak — वाक् सहायक

**Fill an Indian government form just by speaking, in your own language.**

Vak Sahayak ("voice helper") is a voice-first assistant for applying to government
services. A citizen taps one button, speaks naturally, and an AI agent listens,
asks for each field conversationally, and fills the form for them — no typing, no
reading dense PDFs, no English required.

> **Status: working prototype.** Built as a proposal for a voice-driven government
> form-filling service. It runs end-to-end on a live URL today (see
> [Live demo](#live-demo)), but it is **not yet production-hardened** — see
> [Prototype caveats](#prototype-caveats).

---

## The problem

Filling a government form (Aadhaar update, PAN, ration card…) assumes the citizen
can read the form, type accurately, and often work in English. That excludes a
large share of the people the services exist for — first-time applicants, elderly
citizens, low-literacy and non-English speakers, and anyone on a phone.

Vak Sahayak removes the keyboard. **You talk; it fills.**

## What it does

1. The citizen picks a service (Aadhaar / PAN / Ration card).
2. They press **"Fill the Form by Voice"** and just speak.
3. The voice agent greets them, walks through each field one at a time, confirms
   what it heard, and fills the on-screen form live as they talk.

### Services in the prototype

| Service | Form | Fields captured |
| --- | --- | --- |
| **Aadhaar** | Aadhaar Card Update | Name, gender, father's name, age/DOB, address, mobile, email |
| **PAN** | PAN Card Application | Name, father's name, DOB, gender, Aadhaar no., mobile, address |
| **Ration** | Ration Card Application | Head of family, gender, Aadhaar, income, members, category, district |

Adding a new form is a **single-file change** — see [Adding a form](#adding-a-form).

## How it works

Two independent pieces talk over [LiveKit](https://livekit.io):

```
  ┌─────────────────────────┐         ┌──────────────────────────────┐
  │  Frontend (Next.js)      │         │  Voice Agent (LiveKit Cloud) │
  │  — Vercel                │         │  — vak-seva project          │
  │                          │  voice  │                              │
  │  • pick service          │◀───────▶│  • Sarvam STT  (speech→text) │
  │  • mint token + dispatch │  (WebRTC)│  • Groq LLM    (conversation)│
  │  • render form live      │         │  • Sarvam TTS  (text→speech) │
  │  • form-schemas.ts ──────┼────────▶│  • fills the form it's handed│
  │    (source of truth)     │ schema  │    (schema-agnostic)         │
  └─────────────────────────┘ via job  └──────────────────────────────┘
                              metadata
```

- **Frontend** (`/` — this repo): Next.js app. The user selects a service; the
  token route (`app/api/token/route.ts`) mints a LiveKit token **and** dispatches
  the agent, passing the chosen form's schema in the job metadata.
- **Voice agent** (`voice-agent/`): a self-contained LiveKit agent deployed to
  LiveKit Cloud. It carries **no form catalog** — it fills whatever schema arrives
  in the dispatch metadata. Speech-to-text and text-to-speech run on
  [Sarvam](https://sarvam.ai) (built for Indian languages); the conversation runs
  on a Groq-hosted LLM; voice activity detection uses Silero.

See [`voice-agent/README.md`](./voice-agent/README.md) for the agent internals.

## Live demo

The agent is deployed on the **`vak-seva`** LiveKit Cloud project and the frontend
is on Vercel. Open the deployed URL, pick a service, allow the mic, and talk.

## Run it locally

You need two terminals — the frontend and the agent.

**1. Frontend** (repo root):

```bash
pnpm install
cp .env.example .env.local     # add LIVEKIT_URL / API_KEY / API_SECRET, AGENT_NAME=vak-sahayak
pnpm dev                       # http://localhost:3000
```

**2. Voice agent** (`voice-agent/`):

```bash
cd voice-agent
pnpm install
cp .env.example .env.local     # add SARVAM_API_KEY, OPENAI_API_KEY (Groq), LIVEKIT_*
pnpm dev
```

Full agent setup and LiveKit Cloud deploy steps are in
[`voice-agent/README.md`](./voice-agent/README.md).

## Adding a form

Add an entry to `FORM_SCHEMAS` in [`lib/form-schemas.ts`](./lib/form-schemas.ts):

```ts
myservice: {
  title: 'My Service Application',
  description: 'One-line description shown to the user.',
  fields: [
    { id: 'full_name', label: 'Full Name', icon: User },
    // …
  ],
},
```

That's it — the new form appears in the picker and the agent fills it. No agent
code or redeploy needed (the schema travels at dispatch time).

## Tech stack

- **Frontend:** Next.js 15, React 19, LiveKit Agents UI components, Tailwind, shadcn/ui
- **Voice agent:** Node/TypeScript, `@livekit/agents`, Sarvam STT/TTS, Groq LLM, Silero VAD
- **Infra:** Vercel (frontend) · LiveKit Cloud (agent, `vak-seva` / ap-south)

## Prototype caveats

This is a proposal prototype, not a deployed government service. Before any real
use it needs, at minimum:

- **Authentication** on the token route (`app/api/token/route.ts`) — it is
  currently **unauthenticated** so anyone with the URL can start a session.
- **No data is persisted or submitted** — the filled form stays in the browser;
  it is not sent to any government system.
- **Privacy & compliance review** for handling Aadhaar/PAN and other personal
- Production rate limiting, abuse protection, and accessibility testing.

---

*Built on the LiveKit Agents starter for React.*
