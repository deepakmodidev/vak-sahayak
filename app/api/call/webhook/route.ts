import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

    // Event type lives under `event` or `type` depending on Ringg config.
    const event = (payload.event ?? payload.type) as string | undefined;

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

    // --- Idempotency: never re-process a completed row -------------------
    if (row.status === 'completed') {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    const status = payload.status as unknown;
    const subStatus = payload.sub_status as unknown;

    if (event === 'all_processing_completed') {
      const serviceType = row.service_type as string;
      // Fields come from Ringg's configured client_analysis structured extraction.
      const fields = extractFieldsFromWebhook(payload, serviceType);

      // A no-answer / failed call still fires this event; mark it failed.
      const finalStatus = looksLikeFailure(status, subStatus) ? 'failed' : 'completed';

      // Store transcript only if present (jsonb); never store recording_url.
      const transcriptJson =
        payload.transcript !== undefined && payload.transcript !== null
          ? JSON.stringify(payload.transcript)
          : null;

      // Merge extracted fields into existing fields; backfill ringg_call_id if
      // we matched by submission_id and it wasn't stored yet.
      await sql`
        UPDATE public.form_submissions
        SET
          fields = fields || ${JSON.stringify(fields)}::jsonb,
          status = ${finalStatus},
          transcript = COALESCE(${transcriptJson}::jsonb, transcript),
          ringg_call_id = COALESCE(ringg_call_id, ${callId})
        WHERE id = ${rowId}
      `;

      return NextResponse.json({ ok: true, status: finalStatus });
    }

    // --- Non-final events: status-only updates ---------------------------
    // For call_completed / failed-style events we only adjust status (never
    // overwrite a completed row, guarded above). Do not clobber an already
    // 'calling' row back to 'pending'.
    if (looksLikeFailure(event, status, subStatus)) {
      await sql`
        UPDATE public.form_submissions
        SET status = 'failed', ringg_call_id = COALESCE(ringg_call_id, ${callId})
        WHERE id = ${rowId} AND status <> 'completed'
      `;
      return NextResponse.json({ ok: true, status: 'failed' });
    }

    // Other lifecycle events (e.g. call_started/call_completed without final
    // processing) — just acknowledge.
    return NextResponse.json({ ok: true, event: event ?? null });
  } catch (error) {
    // Prefer 200 for transient/bug safety so Ringg doesn't retry-storm on a bug
    // on our side; the error is logged for investigation. (Clearly malformed
    // bodies already returned 400 above.)
    console.error('[call/webhook] handler error', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
