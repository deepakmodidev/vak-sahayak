/**
 * Single source of truth for human-friendly submission references.
 *
 * Format: `VS-NNNN-XX` — 4 digits, then 2 uppercase alphanumerics — e.g. "VS-8846-I0".
 * Matches the SQL backfill format in db/migrations/002_add_reference.sql.
 */
export function generateReference(): string {
  const digits = Math.floor(1000 + Math.random() * 9000); // 1000–9999
  const suffix = Math.random().toString(36).slice(2, 4).toUpperCase().padEnd(2, '0');
  return `VS-${digits}-${suffix}`;
}
