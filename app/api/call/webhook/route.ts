import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isTerminalStatus } from '@/lib/call-status';
import { extractFieldsFromWebhook } from '@/lib/ringg';

export const revalidate = 0;

/**
 * Ringg → us webhook. Receives call lifecycle events; the comprehensive final
 * one is `all_processing_completed`, which carries the structured extraction
 * (`client_analysis`) we map onto our form fields.
 *
 * NOT session-auth-gated (Ringg has no user session). Instead we verify a
 * shared secret from the `x-webhook-secret` header OR a `?secret=` query param.
 *
 * Privacy: per plan §8 we DO NOT store `recording_url`. We may store the
 * transcript.
 *
 * Idempotency: Ringg fires several events and retries, so this handler must be
 * safe to call repeatedly — once a row is `completed` we no-op.
 */

// Words in Ringg's status/sub_status that mean the call did not succeed.
const FAILURE_HINTS = ['fail', 'no-answer', 'no_answer', 'noanswer', 'busy', 'declined', 'rejected', 'cancel', 'voicemail', 'unanswered'];

function looksLikeFailure(...values: unknown[]): boolean {
  return values.some((v) => {
    if (typeof v !== 'string') return false;
    const s = v.toLowerCase();
    return FAILURE_HINTS.some((h) => s.includes(h));
  });
}

export async function POST(req: Request) {
  try {
    // --- Secret verification ---------------------------------------------
    // NOTE: the exact webhook auth mechanism Ringg uses should be confirmed at
    // setup; we accept the secret via header or query param to be flexible.
    const url = new URL(req.url);
    const provided = req.headers.get('x-webhook-secret') ?? url.searchParams.get('secret');
    const expected = process.env.RINGG_WEBHOOK_SECRET;

    if (expected) {
      if (provided !== expected) {
        return new NextResponse('UNAUTHORIZED', { status: 401 });
      }
    } else {
      console.warn(
        '[call/webhook] RINGG_WEBHOOK_SECRET is not set — accepting unverified webhook (prototype only).'
      );
    }

    const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) {
      // Clearly malformed body — surface a 400 so the misconfiguration is visible.
      return new NextResponse('BAD_REQUEST: webhook body was not valid JSON.', { status: 400 });
    }

    // Ringg sends the event name under `event_type` (NOT `event`/`type`).
    // Reading the wrong key meant `all_processing_completed` never matched, so
    // fields were never extracted. Keep the old keys as a defensive fallback.
    const event = (payload.event_type ?? payload.event ?? payload.type) as
      | string
      | undefined;

    // --- Locate the submission -------------------------------------------
    const customArgs = (payload.custom_args_values ?? {}) as Record<string, unknown>;
    const submissionId =
      typeof customArgs.submission_id === 'string' ? customArgs.submission_id : null;
    const callId = typeof payload.call_id === 'string' ? payload.call_id : null;

    let rows: Record<string, unknown>[] = [];
    if (submissionId) {
      rows = (await sql`
        SELECT id, service_type, status, ringg_call_id
        FROM public.form_submissions
        WHERE id = ${submissionId}
        LIMIT 1
      `) as Record<string, unknown>[];
    }
    if (rows.length === 0 && callId) {
      rows = (await sql`
        SELECT id, service_type, status, ringg_call_id
        FROM public.form_submissions
        WHERE ringg_call_id = ${callId}
        LIMIT 1
      `) as Record<string, unknown>[];
    }

    if (rows.length === 0) {
      // Webhooks retry — ack (200) so Ringg doesn't hammer us; just log it.
      console.warn(
        `[call/webhook] no submission found (event=${event ?? 'unknown'}, submission_id=${submissionId}, call_id=${callId})`
      );
      return NextResponse.json({ ok: true, matched: false });
    }

    const row = rows[0];
    const rowId = row.id as string;

    // --- Idempotency: terminal states are sticky ------------------------
    // Ringg retries events and fires them out of order; once we've reached a
    // terminal state (completed OR failed) we never reprocess, so a late
    // all_processing can't resurrect a failed call and duplicates are no-ops.
    if (isTerminalStatus(String(row.status))) {
      return NextResponse.json({ ok: true, alreadyTerminal: true, status: row.status });
    }

    const status = payload.status as unknown;
    const subStatus = payload.sub_status as unknown;

    // The RAW status we surface to the user / for debugging: prefer Ringg's own
    // `status` field (completed/failed/retry/error/...), else fall back to the
    // event name (e.g. 'call_started'). We never invent our own wording here.
    const ringgStatus =
      typeof status === 'string' && status ? status : (event ?? null);

    // Persist the EXACT event Ringg sent (minus the big/sensitive blobs) so the
    // whole flow can be debugged later from the row's append-only `events` array.
    const eventEntry: Record<string, unknown> = {
      received_at: new Date().toISOString(),
      ...payload,
    };
    delete eventEntry.recording_url; // never store, per privacy plan §8
    delete eventEntry.transcript; // stored in its own column when final
    const eventJson = JSON.stringify([eventEntry]);

    if (event === 'all_processing_completed') {
      const serviceType = row.service_type as string;
      // Fields come from Ringg's configured client_analysis structured extraction.
      const fields = extractFieldsFromWebhook(payload, serviceType);
      if (Object.keys(fields).length === 0) {
        // Completed but nothing mapped — almost always a client_analysis key
        // mismatch. Log the raw keys so it's debuggable (also kept in `events`).
        const ca = payload.client_analysis;
        console.warn(
          `[call/webhook] all_processing_completed but 0 fields mapped (row=${rowId}, service=${serviceType}). client_analysis keys:`,
          ca && typeof ca === 'object' ? Object.keys(ca as Record<string, unknown>) : ca
        );
      }

      // Decide the outcome from Ringg's authoritative `status` enum
      // (completed/failed/error/cancelled/forwarded) via exact match — avoids
      // substring false-positives — plus a voicemail-ish sub_status counts as a
      // failure (no human answered).
      const statusStr = typeof status === 'string' ? status.toLowerCase() : '';
      const TERMINAL_FAIL = new Set([
        'failed',
        'error',
        'cancelled',
        'canceled',
        'no-answer',
        'busy',
        'declined',
        'rejected',
      ]);
      const finalStatus =
        TERMINAL_FAIL.has(statusStr) || looksLikeFailure(subStatus) ? 'failed' : 'completed';

      // Store transcript only if present (jsonb); never store recording_url.
      const transcriptJson =
        payload.transcript !== undefined && payload.transcript !== null
          ? JSON.stringify(payload.transcript)
          : null;

      // Merge extracted fields; record the raw Ringg status + event; backfill
      // ringg_call_id if we matched by submission_id and it wasn't stored yet.
      await sql`
        UPDATE public.form_submissions
        SET
          fields = fields || ${JSON.stringify(fields)}::jsonb,
          status = ${finalStatus},
          call_status = ${ringgStatus},
          events = events || ${eventJson}::jsonb,
          transcript = COALESCE(${transcriptJson}::jsonb, transcript),
          ringg_call_id = COALESCE(ringg_call_id, ${callId})
        WHERE id = ${rowId}
      `;

      return NextResponse.json({ ok: true, status: finalStatus, call_status: ringgStatus });
    }

    // --- Non-final events ------------------------------------------------
    // A failure-looking event (no-answer / busy / voicemail / declined) marks
    // the row failed. Checked first so a `call_completed` that went to voicemail
    // isn't recorded as a normal in-progress event.
    if (looksLikeFailure(event, status, subStatus)) {
      await sql`
        UPDATE public.form_submissions
        SET status = 'failed',
            call_status = ${ringgStatus},
            events = events || ${eventJson}::jsonb,
            ringg_call_id = COALESCE(ringg_call_id, ${callId})
        WHERE id = ${rowId} AND status <> 'completed'
      `;
      return NextResponse.json({ ok: true, status: 'failed', call_status: ringgStatus });
    }

    // Any other live event (call_started, call_completed, recording/analysis
    // ready): record the raw Ringg status + event. Internal status stays
    // 'calling' until all_processing_completed; the UI shows `call_status`.
    await sql`
      UPDATE public.form_submissions
      SET call_status = ${ringgStatus},
          events = events || ${eventJson}::jsonb,
          ringg_call_id = COALESCE(ringg_call_id, ${callId})
      WHERE id = ${rowId} AND status NOT IN ('completed', 'failed')
    `;
    return NextResponse.json({ ok: true, event: event ?? null, call_status: ringgStatus });
  } catch (error) {
    // Prefer 200 for transient/bug safety so Ringg doesn't retry-storm on a bug
    // on our side; the error is logged for investigation. (Clearly malformed
    // bodies already returned 400 above.)
    console.error('[call/webhook] handler error', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
