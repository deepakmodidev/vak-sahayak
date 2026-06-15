import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { generateReference } from '@/lib/reference';
import { initiateCall, isRinggConfigured } from '@/lib/ringg';

export const revalidate = 0;

// Roughly E.164: a leading + and 8–15 digits. The UI sends +91… numbers.
const E164 = /^\+\d{8,15}$/;

/**
 * Starts an outbound Ringg call-back for the signed-in user.
 *
 * Body: { serviceType: string, phone: string (E.164), name?: string }
 * Flow: validate → (503 if Ringg unconfigured, before any DB write) → insert a
 * `channel = 'call'`, `status = 'pending'` row → initiate the Ringg call → on
 * success mark `calling` + store ringg_call_id; on failure mark `failed`.
 * Auth-gated; user_id always comes from the session, never the request body.
 */
export async function POST(req: Request) {
  const noStore = { headers: { 'Cache-Control': 'no-store' } };
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return new NextResponse('UNAUTHORIZED', { status: 401, ...noStore });
    }

    const body = await req.json().catch(() => null);
    const serviceType = body?.serviceType;
    const phone = body?.phone;
    const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null;

    if (!serviceType || typeof serviceType !== 'string' || !FORM_SCHEMAS[serviceType]) {
      return new NextResponse('INVALID_SERVICE_TYPE', { status: 400, ...noStore });
    }

    if (!phone || typeof phone !== 'string' || !E164.test(phone)) {
      return new NextResponse(
        'INVALID_PHONE: provide a phone number in international format, e.g. +9198XXXXXXXX.',
        { status: 400, ...noStore }
      );
    }

    // Fail loudly BEFORE inserting a row if calling isn't set up. The UI uses
    // this 503 / RINGG_NOT_CONFIGURED to show "calling isn't set up yet".
    if (!isRinggConfigured()) {
      return new NextResponse(
        'RINGG_NOT_CONFIGURED: phone-call form filling is not configured on this deployment yet.',
        { status: 503, ...noStore }
      );
    }

    const reference = generateReference();

    const rows = await sql`
      INSERT INTO public.form_submissions (user_id, channel, service_type, status, phone, reference, fields)
      VALUES (
        ${session.user.id},
        'call',
        ${serviceType},
        'pending',
        ${phone},
        ${reference},
        '{}'::jsonb
      )
      RETURNING id
    `;
    const submissionId = rows[0]?.id as string;

    try {
      const { callId, status: callStatus } = await initiateCall({
        name: name || 'Citizen',
        phone,
        serviceType,
        submissionId,
      });

      // `call_status` stores Ringg's raw status verbatim (e.g. 'ongoing');
      // `status` stays our internal control value.
      await sql`
        UPDATE public.form_submissions
        SET status = 'calling', ringg_call_id = ${callId}, call_status = ${callStatus ?? null}
        WHERE id = ${submissionId}
      `;

      return NextResponse.json({ submissionId }, noStore);
    } catch (callError) {
      console.error('[call/initiate] Ringg initiation failed', callError);
      await sql`
        UPDATE public.form_submissions
        SET status = 'failed'
        WHERE id = ${submissionId}
      `;
      return new NextResponse(
        'CALL_FAILED: could not start the phone call. Please try again later.',
        { status: 502, ...noStore }
      );
    }
  } catch (error) {
    console.error('[call/initiate] unexpected error', error);
    return new NextResponse('INTERNAL_ERROR', { status: 500, ...noStore });
  }
}
