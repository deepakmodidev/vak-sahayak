# Plan — "Fill Form by Voice Call" (Ringg AI · outbound call-back)

> Status: **approved plan, not yet built.** Scope agreed: plan only — review before any code.
> This is the second voice modality alongside the existing in-browser LiveKit assistant.

---

## 1. What we're adding

A **second way to fill a form**, for citizens who can't or don't want to use a browser
mic session: they enter their phone number, Ringg AI calls them, they talk, and the
form is filled from Ringg's post-call extraction.

The two modalities, side by side:

| | In-browser voice (exists today) | Phone call-back (new) |
|---|---|---|
| Where | On the page, browser mic | Real phone call (PSTN), no screen |
| Engine | LiveKit Cloud agent (Sarvam + Groq) | Ringg AI assistant |
| Form fill | **Synchronous** — live `form_update` packets | **Asynchronous** — extracted after the call |
| Needs | nothing persisted | DB + auth (results must be stored & shown back) |
| Route | `/portal/voice` | `/portal/call` |

`lib/form-schemas.ts` stays the **single source of truth**. Just as the token route
derives the LiveKit dispatch metadata from it, we derive the Ringg assistant's prompt
and extraction schema from it.

---

## 2. Architecture & data flow

```
  ┌──────────────────────────┐                    ┌─────────────────────────┐
  │  Frontend (Next.js)      │  1. pick service   │  Ringg AI (telephony)   │
  │  — Vercel                │     + phone no.    │                         │
  │                          │                    │  • dials the user (PSTN)│
  │  • sign in (Neon Auth)   │──2. POST───┐       │  • Indian-lang voice    │
  │  • /api/call/initiate ───┼─3. initiate├──────▶│  • collects fields      │
  │  • results page (poll)   │   call     │       │  • client_analysis      │
  └─────────▲────────────────┘            │       │    extracts structured  │
            │                             │       │    data                 │
            │ 6. read row                 │       └───────────┬─────────────┘
            │                             │                   │ 5. webhook
  ┌─────────┴────────────────┐            │                   │ all_processing_
  │  Neon Postgres           │◀─4. insert ┘                   │ completed
  │  • neon_auth (users)     │◀──────────────────────────────-┘
  │  • form_submissions      │   /api/call/webhook (writes extracted fields)
  └──────────────────────────┘
```

1. User signs in (Neon Auth). This also closes the README caveat that the token route
   is unauthenticated — the call path is auth-gated from day one.
2. User picks a service + enters phone number on `/portal/call`.
3. `/api/call/initiate` inserts a `form_submissions` row (status `pending`), then calls
   Ringg with `agent_id`, `mobile_number`, and `custom_args_values` (carries
   `submission_id`, `service_type`, field list).
4. Save the returned `call_id`, set status `calling`.
5. User talks on the phone. Ringg's **client_analysis** extracts the fields, then fires
   the **`all_processing_completed`** webhook to `/api/call/webhook`.
6. Webhook verifies the secret, matches the row by `submission_id`, writes
   `fields` / `transcript` / `status = completed`. The results page (polling) shows them.

---

## 3. Routing (decision: Option A — chooser)

```
/                     marketing landing            (unchanged)
/portal               chooser: "How do you want to fill your form?"   (repurposed)
/portal/voice         in-browser live voice        ← today's <App>, moved down one level
/portal/call          phone call-back: pick service + enter number    (new)
/portal/call/[id]     result of one call (read-only FormVisualizer, polls)  (new)
```

- Named by **channel** (`voice` = on-page mic, `call` = phone), not `voice-assistant` /
  `voice-call` — the shared `voice-` prefix made them confusable.
- `/portal` stays a valid URL, so the existing `href="/portal"` CTAs in `app/page.tsx`
  (header, hero, CTA) keep working — they just land on the chooser now.
- Only real move: `<App>` shifts from `app/portal/page.tsx` to `app/portal/voice/page.tsx`.

API routes mirror the structure:

```
/api/token            existing — LiveKit dispatch for /portal/voice   (unchanged)
/api/call/initiate    triggers the Ringg outbound call                (new)
/api/call/webhook     receives Ringg's all_processing_completed        (new)
```

---

## 4. Ringg API surface (confirmed from docs.ringg.ai)

| Need | Mechanism |
|---|---|
| Start a call | `POST https://prod-api.ringg.ai/ca/api/v0/calling/outbound/individual`, header `X-API-KEY` |
| Per-call context | `custom_args_values` object → referenced in assistant prompt as `@{{var}}` |
| Caller ID | `from_number_id` **or** `from_number` (exactly one) |
| Get filled fields | **client_analysis** (custom post-call extraction configured on the assistant) |
| Delivery | webhook `all_processing_completed` → `custom_args_values`, extracted analysis, `transcript`, `status`, `recording_url` (24h) |
| Status tracking | `call_started` / `call_completed` events + `call_id` from the initiate response |

Sample initiate payload:

```json
{
  "name": "<recipient name>",
  "mobile_number": "+9198xxxxxxxx",
  "agent_id": "<RINGG_AGENT_ID>",
  "from_number_id": "<RINGG_FROM_NUMBER_ID>",
  "custom_args_values": {
    "submission_id": "<our uuid>",
    "service_type": "aadhaar",
    "fields": "Full Name, Gender, Father's Name, Age/DOB, Address, Mobile, Email"
  }
}
```

---

## 5. Data model (Neon Postgres)

```sql
-- public.form_submissions  (shared by BOTH modalities — keyed by `channel`)
id            uuid primary key default gen_random_uuid()
user_id       text not null            -- from Neon Auth
channel       text not null            -- 'voice' (in-browser) | 'call' (Ringg phone)
service_type  text not null            -- 'aadhaar' | 'pan' | 'ration'
phone         text                     -- E.164; required for 'call', null for 'voice'
status        text not null default 'pending'  -- pending|calling|completed|failed
ringg_call_id text                     -- 'call' only
fields        jsonb default '{}'       -- answers keyed by FORM_SCHEMAS field id
transcript    jsonb
recording_url text                     -- see §8: omit for Aadhaar/PAN
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

One table serves both modalities. The in-browser assistant writes a `channel = 'voice'`
row on submit (status straight to `completed`); the call flow writes `channel = 'call'`
(`pending` → `calling` → `completed`). This gives a unified per-user submission history
and exercises the DB path on the simple synchronous flow before the async call path.

- **RLS** restricting rows to their owner `user_id` (Neon Auth is RLS-compatible).
- Access via `@neondatabase/serverless` (HTTP driver) using `DATABASE_URL`. Plain `neon()`
  tagged-template SQL + one migration is enough for a 3-form prototype (Drizzle optional).
- Use a **Neon branch** for local dev so test calls don't write into prod.
- Webhook must be **idempotent** — upsert by `ringg_call_id`; only `all_processing_completed`
  writes the final state (Ringg fires several events + retries).

---

## 6. File changes

**New**
- `lib/db.ts` — Neon client.
- `lib/ringg.ts` — Ringg client + `schemaToPrompt()` / `schemaToExtraction()` derived from
  `FORM_SCHEMAS`, and a mapper from Ringg's extracted variable names → our field ids.
- `app/api/call/initiate/route.ts` — auth-gated; insert row → call Ringg → save `call_id`.
- `app/api/call/webhook/route.ts` — verify secret → match by `submission_id` → write result.
- `app/portal/page.tsx` — **repurpose** into the chooser.
- `app/portal/voice/page.tsx` — **move** today's `<App>` render here.
- `app/portal/call/page.tsx` — service picker + phone input + "Call me" button.
- `app/portal/call/[id]/page.tsx` — result view; reuse `FormVisualizer` read-only; poll ~3s.
- Neon Auth wiring: handler route + middleware + sign-in page (per Neon Auth Next.js guide).
- `db/migrations/001_form_submissions.sql`.

**Modified**
- `.env.example` — add the new vars (§7).
- `README.md` — document the second modality + caveats.

---

## 7. Environment variables

```bash
# Ringg AI
RINGG_API_KEY=
RINGG_AGENT_ID=            # the assistant UUID
RINGG_FROM_NUMBER_ID=      # purchased caller-ID number
RINGG_WEBHOOK_SECRET=      # verify inbound webhooks

# Neon
DATABASE_URL=              # Neon connection string
# Neon Auth (Better Auth) — exact names per `neonctl init` output
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=
```

> Note: current Neon Auth is powered by **Better Auth** (the older `@stackframe/stack`
> path is legacy). Confirm which your project provisions at setup and follow that guide.

---

## 8. Decisions taken (defaults — all reversible)

1. **One parameterized Ringg assistant**, not three. Keeps the schema in one place; the
   form is selected per call via `custom_args_values.service_type`.
2. **Recordings off** (don't store `recording_url`) for Aadhaar/PAN, and play a consent /
   recording disclosure at call start. Minimises the personal-data surface.
3. **Live updates via polling** on the result page (simple; webhook is async). SSE later
   if needed.

---

## 9. Caveats (carry into README)

1. **Privacy/compliance** — Aadhaar/PAN spoken over third-party telephony means transcripts
   live on Ringg. Recordings off + consent disclosure (decision §8.2). Flag loudly before
   any real use, same spirit as existing README caveats.
2. **Paid telephony** — needs a funded Ringg account + number to test end-to-end; no free
   local path like the browser flow.
3. **Conversational control moves into Ringg** — the in-code FSM (`focus → update → review
   → submit`) doesn't exist on a phone call; that logic becomes the assistant prompt +
   extraction config in Ringg's dashboard. Trade fine-grained control for reach.

---

## 10. Setup checklist (dashboard work, done by you)

**Ringg**
1. Create + fund account; copy **API key**.
2. Buy/assign a **phone number** → `from_number_id`.
3. Create **one assistant**, parameterized via `custom_args`. Prompt: Indian languages,
   one field per turn, read-back + confirm, reference `@{{service_type}}` + field list.
4. Configure **client_analysis** extraction schema = union of the form fields.
5. Set **webhook URL** → `https://<vercel-domain>/api/call/webhook`, set the secret,
   subscribe to `all_processing_completed` (+ `call_completed` for status).
6. Place a real test call to your own phone.

**Neon**
1. Create project → copy `DATABASE_URL`.
2. `npx neonctl@latest init` (or dashboard) to enable **Neon Auth** → get auth env vars.
3. Run migration → `public.form_submissions` + RLS.
4. Wire auth into Next.js; protect `/portal/**` and `/api/call/initiate`.
5. Create a **dev branch** for local testing.

> Local webhook testing: Ringg must reach a public URL. Test against a Vercel preview,
> or tunnel local dev with `ngrok` / `cloudflared` and point the webhook there temporarily.

---

## 11. Build phases (when greenlit) — foundation first

The foundation (auth + DB) is built **against the existing assistant first**, so it's
validated on the simple synchronous flow before the async telephony path is added.

**Foundation (existing assistant)**
- **P0a** — Neon project + NeonDB + Neon Auth provisioned; `form_submissions` table + RLS.
  Pure infra; touches no existing code.
- **P0b** — Gate `/portal/**` and `/api/token` behind Neon Auth; sign-in/sign-out works.
  Closes the unauthenticated-token caveat. Touches only the entry gate, not voice logic.
- **P0c** — On voice-assistant submit (`form_submitted`), persist a `channel = 'voice'`
  row. Unified history + exercises the DB write path on the known-good flow.

**Call feature (builds on the foundation)**
- **P1** — `/api/call/initiate` triggers a real Ringg call for one hardcoded form; phone rings.
- **P2** — webhook receiver persists extracted fields (`channel = 'call'`); result page renders them.
- **P3** — schema-driven for all 3 forms; chooser + `/portal/voice` move; polling; failed/
  unanswered/partial states.
- **P4** — compliance pass (consent, recording policy), rate limiting, README.

---

## Sources
- Ringg — Initiate Individual Call: https://docs.ringg.ai/api-reference/endpoint/calling/initiate-individual-call
- Ringg — Webhook Payloads: https://docs.ringg.ai/webhooks/payloads
- Ringg — Voice Calling: https://docs.ringg.ai/api-reference/tutorials/voice-calling
- Neon — Introduction: https://neon.com/docs/introduction
- Neon — Auth Overview: https://neon.com/docs/auth/overview
