-- 002_add_reference.sql
-- Adds a stable, human-friendly reference id to submissions (e.g. "VS-8846-I0").
-- Generated server-side at insert; this migration backfills existing rows.
--
-- HOW TO RUN:
--   • Neon SQL Editor: paste and run.
--   • psql:  psql "$DATABASE_URL" -f db/migrations/002_add_reference.sql

alter table public.form_submissions
  add column if not exists reference text;

-- Backfill any pre-existing rows that have no reference yet.
update public.form_submissions
set reference =
  'VS-' || lpad(((floor(random() * 9000))::int + 1000)::text, 4, '0')
        || '-' || upper(substr(md5(random()::text), 1, 2))
where reference is null;
