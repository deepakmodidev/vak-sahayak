-- 001_form_submissions.sql
-- Vak Sahayak — shared submission table for BOTH modalities (voice + phone call).
-- See docs/voice-call-feature-plan.md §5 (data model).
--
-- HOW TO RUN:
--   • Neon SQL Editor: paste this whole file and run.
--   • psql:  psql "$DATABASE_URL" -f db/migrations/001_form_submissions.sql
-- Idempotent: safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP-then-CREATE
-- for policies).

create table if not exists public.form_submissions (
  id            uuid primary key default gen_random_uuid(),
  -- Holds the Neon Auth user id (the JWT `sub`). Kept as plain text on purpose:
  -- we do NOT add a hard FK to the neon_auth user table because the auth schema
  -- table name can vary by SDK version.
  user_id       text not null,
  channel       text not null,                 -- 'voice' (in-browser) | 'call' (Ringg phone)
  service_type  text not null,                 -- 'aadhaar' | 'pan' | 'ration'
  phone         text,                          -- E.164; required for 'call', null for 'voice'
  status        text not null default 'pending', -- pending | calling | completed | failed
  ringg_call_id text,                          -- 'call' only
  fields        jsonb default '{}'::jsonb,     -- answers keyed by FORM_SCHEMAS field id
  transcript    jsonb,
  recording_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Per-user history lookups.
create index if not exists form_submissions_user_id_idx
  on public.form_submissions (user_id, created_at desc);

-- Webhook idempotency / lookup by Ringg call id (call flow only).
create index if not exists form_submissions_ringg_call_id_idx
  on public.form_submissions (ringg_call_id);

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists form_submissions_set_updated_at on public.form_submissions;
create trigger form_submissions_set_updated_at
  before update on public.form_submissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security (defense-in-depth).
--
-- NOTE: the app's HTTP driver (lib/db.ts) connects with the role in DATABASE_URL
-- and does NOT carry the user JWT, so it is not the user-scoped enforcement point
-- here — app code filters by user_id explicitly. These policies protect any
-- JWT-authenticated (authenticated-role) access path.
--
-- `auth.user_id()` is Neon's RLS helper returning the current user's id (JWT
-- `sub`). VERIFY this function name against your Neon project's RLS setup — the
-- exact name can vary by Neon Auth / Neon RLS version (e.g. it may live under a
-- different schema). Adjust the four policies below if your project differs.
-- ---------------------------------------------------------------------------
alter table public.form_submissions enable row level security;

drop policy if exists form_submissions_select_own on public.form_submissions;
create policy form_submissions_select_own
  on public.form_submissions
  for select
  using (user_id = auth.user_id());

drop policy if exists form_submissions_insert_own on public.form_submissions;
create policy form_submissions_insert_own
  on public.form_submissions
  for insert
  with check (user_id = auth.user_id());

drop policy if exists form_submissions_update_own on public.form_submissions;
create policy form_submissions_update_own
  on public.form_submissions
  for update
  using (user_id = auth.user_id())
  with check (user_id = auth.user_id());

drop policy if exists form_submissions_delete_own on public.form_submissions;
create policy form_submissions_delete_own
  on public.form_submissions
  for delete
  using (user_id = auth.user_id());
