import { FORM_SCHEMAS } from '@/lib/form-schemas';

/**
 * Ringg AI client — outbound call initiation + post-call webhook extraction.
 *
 * All endpoint URL + header literals live HERE so there is a single place to
 * adjust if Ringg changes its API surface.
 *
 * Env (read LAZILY inside functions, never at module top-level, so `next build`
 * works with no env set):
 *   RINGG_API_KEY        — Ringg dashboard → API key
 *   RINGG_AGENT_ID       — the parameterized assistant UUID
 *   RINGG_FROM_NUMBER_ID — the purchased caller-ID number id
 */

const RINGG_INITIATE_URL =
  'https://prod-api.ringg.ai/ca/api/v0/calling/outbound/individual';

/** True iff all three Ringg env vars required to place a call are present. */
export function isRinggConfigured(): boolean {
  return Boolean(
    process.env.RINGG_API_KEY &&
      process.env.RINGG_AGENT_ID &&
      process.env.RINGG_FROM_NUMBER_ID
  );
}

/**
 * A comma-joined list of human field labels for the given service type, e.g.
 * "Full Name, Gender, Father's Name, ...". Passed to Ringg as call context so
 * the assistant prompt (`@{{fields}}`) knows what to collect.
 */
export function buildFieldList(serviceType: string): string {
  const schema = FORM_SCHEMAS[serviceType];
  if (!schema) return '';
  return schema.fields.map((f) => f.label).join(', ');
}

export interface InitiateCallArgs {
  name: string;
  phone: string; // E.164, e.g. +9198...
  serviceType: string;
  submissionId: string;
}

export interface InitiateCallResult {
  callId: string;
  status?: string;
}

/**
 * Places an outbound call via Ringg. Throws a clear Error if Ringg is not
 * configured or if Ringg returns a non-2xx response (message includes the
 * status + body text for debuggability). On success returns the Ringg call id.
 */
export async function initiateCall({
  name,
  phone,
  serviceType,
  submissionId,
}: InitiateCallArgs): Promise<InitiateCallResult> {
  if (!isRinggConfigured()) {
    throw new Error(
      'RINGG_NOT_CONFIGURED: RINGG_API_KEY, RINGG_AGENT_ID and RINGG_FROM_NUMBER_ID must all be set.'
    );
  }

  const body = {
    name,
    mobile_number: phone,
    agent_id: process.env.RINGG_AGENT_ID,
    from_number_id: process.env.RINGG_FROM_NUMBER_ID,
    // `custom_args_values` are per-call variables referenced in the Ringg
    // assistant prompt as @{{var}}. The assistant selects the form via
    // `service_type` and uses `fields` as the list of things to collect.
    custom_args_values: {
      submission_id: submissionId,
      service_type: serviceType,
      fields: buildFieldList(serviceType),
      branding: 'Vak Sahayak',
    },
  };

  const res = await fetch(RINGG_INITIATE_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.RINGG_API_KEY as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `RINGG_INITIATE_FAILED: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    call_id?: string;
    call_status?: string;
  };

  if (!data.call_id) {
    throw new Error('RINGG_INITIATE_FAILED: response did not include a call_id.');
  }

  return { callId: data.call_id, status: data.call_status };
}

/**
 * Maps Ringg's post-call structured extraction (`client_analysis`) onto our
 * FORM_SCHEMAS field ids.
 *
 * IMPORTANT: the exact shape of `client_analysis` depends on how the user
 * configures the client_analysis schema in the Ringg dashboard, and may need
 * adjustment after a real test call. We handle the common shapes defensively:
 *   1. an object keyed directly by field id:      { full_name: "...", age: "32" }
 *   2. wrapped under a `data` key:                { data: { full_name: "..." } }
 *   3. an array of { name|key, value } pairs:      [{ name: "full_name", value: "..." }]
 *
 * Only keys matching this serviceType's field ids are kept; values are coerced
 * to non-empty strings.
 */
export function extractFieldsFromWebhook(
  payload: unknown,
  serviceType: string
): Record<string, string> {
  const result: Record<string, string> = {};

  const schema = FORM_SCHEMAS[serviceType];
  if (!schema) return result;
  const validIds = new Set(schema.fields.map((f) => f.id));

  const p = (payload ?? {}) as Record<string, unknown>;
  let analysis: unknown = p.client_analysis;

  // Shape 2: unwrap a `data` envelope if present.
  if (
    analysis &&
    typeof analysis === 'object' &&
    !Array.isArray(analysis) &&
    'data' in (analysis as Record<string, unknown>)
  ) {
    analysis = (analysis as Record<string, unknown>).data;
  }

  const coerce = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return null; // skip nested objects/arrays
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  };

  if (Array.isArray(analysis)) {
    // Shape 3: array of { name|key, value } pairs.
    for (const item of analysis) {
      if (!item || typeof item !== 'object') continue;
      const entry = item as Record<string, unknown>;
      const key = (entry.name ?? entry.key ?? entry.id) as unknown;
      if (typeof key !== 'string' || !validIds.has(key)) continue;
      const value = coerce(entry.value);
      if (value !== null) result[key] = value;
    }
  } else if (analysis && typeof analysis === 'object') {
    // Shape 1: object keyed directly by field id.
    for (const [key, value] of Object.entries(analysis as Record<string, unknown>)) {
      if (!validIds.has(key)) continue;
      const coerced = coerce(value);
      if (coerced !== null) result[key] = coerced;
    }
  }

  return result;
}
