import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { generateReference } from '@/lib/reference';

export const revalidate = 0;

/**
 * Persists an in-browser ("voice") form submission for the signed-in user.
 *
 * Body: { serviceType: string, formData: Record<string, string> }
 * Writes a `channel = 'voice'`, `status = 'completed'` row to form_submissions.
 * Auth-gated; the user_id comes from the session, never the request body.
 */
export async function POST(req: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return new NextResponse('UNAUTHORIZED', { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const serviceType = body?.serviceType;
    const formData = body?.formData;

    if (!serviceType || typeof serviceType !== 'string' || !FORM_SCHEMAS[serviceType]) {
      return new NextResponse('INVALID_SERVICE_TYPE', { status: 400 });
    }

    // Normalize to a plain object so we always store valid jsonb.
    const fields =
      formData && typeof formData === 'object' && !Array.isArray(formData)
        ? (formData as Record<string, unknown>)
        : {};

    const reference = generateReference();

    const rows = await sql`
      INSERT INTO public.form_submissions (user_id, channel, service_type, status, phone, reference, fields)
      VALUES (
        ${session.user.id},
        'voice',
        ${serviceType},
        'completed',
        NULL,
        ${reference},
        ${JSON.stringify(fields)}::jsonb
      )
      RETURNING id, reference
    `;

    return NextResponse.json(
      { id: rows[0]?.id, reference: rows[0]?.reference },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[submissions] failed to persist voice submission', error);
    return new NextResponse('INTERNAL_ERROR', { status: 500 });
  }
}

/**
 * Returns the signed-in user's submission history, newest first.
 *
 * Auth-gated; the user_id always comes from the session, never the request.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return new NextResponse('UNAUTHORIZED', { status: 401 });
    }

    const rows = await sql`
      SELECT id, channel, service_type, status, call_status, reference, fields, events, created_at
      FROM public.form_submissions
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[submissions] failed to load submission history', error);
    return new NextResponse('INTERNAL_ERROR', { status: 500 });
  }
}
