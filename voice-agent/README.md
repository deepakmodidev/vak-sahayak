# Vak Sahayak — Voice Agent

The LiveKit voice agent that powers the Vak Sahayak form-filling experience. It
is **self-contained** (its own `package.json`, dependencies, and tsconfig) and
**schema-agnostic**: it carries no form catalog. The form to fill arrives in the
dispatch job metadata, so it can be built and deployed to **LiveKit Cloud**
independently of the Next.js frontend (which lives one directory up).

## Layout

```
voice-agent/
├── agent.ts              # entry — LLM probe, form FSM, voice session
├── package.json          # agent-only deps + build/start scripts (compiles to dist/)
├── pnpm-workspace.yaml   # isolates this install + approves native build scripts
├── tsconfig.json         # emits dist/ → run with `node dist/agent.js start`
└── .env.example
```

> `Dockerfile` and `.dockerignore` are **not committed** — `lk agent create`
> generates them automatically. The scaffold runs `pnpm build` then
> `node dist/agent.js start`, which is why `package.json` defines
> `build` / `start` / `download-files`.

> **Schema source of truth:** the form schema lives ONLY in the frontend's
> `../lib/form-schemas.ts`. The token route serializes the selected schema
> (icon-stripped) into the agent dispatch metadata; the agent reads it from
> `ctx.job.metadata` and fills whatever it's handed. No duplicated catalog, no
> sync to maintain.

## Local development

```bash
cd voice-agent
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev                     # or: pnpm console  (terminal-only test)
```

The agent registers with LiveKit under the hardcoded name `vak-sahayak`
(`ServerOptions.agentName` in `agent.ts`); the frontend's token route dispatches
to that same name.

## Deploy to LiveKit Cloud

`lk agent create` scaffolds the `Dockerfile` / `.dockerignore` / `livekit.toml`
and ships the build — no Docker files to hand-write.

```bash
cd voice-agent
lk agent create --project vak-seva --secrets-file .env.local   # first deploy
lk agent deploy --project vak-seva                             # later updates
```

Runtime secrets the agent needs: `SARVAM_API_KEY`, `OPENAI_API_KEY` (Groq key),
optional `GROQ_MODEL`. `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
are injected automatically by LiveKit Cloud.
