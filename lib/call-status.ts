/**
 * Submission status helpers.
 *
 * We keep TWO notions of status, on purpose:
 *   • the internal `status` column — drives control flow only
 *     (pending | calling | completed | failed): when to stop polling, when to
 *     show extracted fields, when to offer "try again".
 *   • Ringg's RAW status (`call_status`) + the raw `events` log — what we
 *     actually SHOW, verbatim, so the flow is debuggable. We never invent
 *     status wording for the call lifecycle; we display exactly what Ringg sends.
 */
export type SubmissionStatus = 'pending' | 'calling' | 'completed' | 'failed';

export function isTerminalStatus(status: string): boolean {
  return status === 'completed' || status === 'failed';
}

/**
 * One webhook event from Ringg, as we persist it in `events` for debugging.
 * It's essentially the raw Ringg payload (minus recording_url + transcript)
 * plus a `received_at` stamp — so any field Ringg sends is preserved.
 */
export interface RinggEvent {
  received_at?: string;
  event_type?: string;
  status?: string;
  sub_status?: string;
  call_id?: string;
  call_duration?: number;
  call_cost?: number;
  called_on?: string;
  [key: string]: unknown;
}
