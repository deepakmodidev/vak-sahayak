-- 003_add_call_debug.sql
-- Surfaces the EXACT data Ringg sends so the call flow is debuggable later.
--   call_status — the raw status string straight from Ringg (e.g. 'ongoing',
--                 'call_started', 'completed', 'failed'). Distinct from our
--                 internal `status` column, which only drives control flow.
--   events      — append-only log of every webhook Ringg pushes (raw payload,
--                 minus recording_url + transcript), each with a received_at.
--
-- HOW TO RUN:
--   • Neon SQL Editor: paste and run.
--   • psql:  psql "$DATABASE_URL" -f db/migrations/003_add_call_debug.sql
-- Idempotent.

alter table public.form_submissions
  add column if not exists call_status text,
  add column if not exists events jsonb not null default '[]'::jsonb;
