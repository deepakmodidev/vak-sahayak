import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const revalidate = 0;

/**
 * Returns a single submission owned by the signed-in user — used by the call
 * result page to poll for status/fields as the async call completes.
 *
 * Auth-gated and owner-scoped (WHERE user_id = session user). Next.js 16:
 * `params` is a Promise, so we await it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const noStore = { headers: { 'Cache-Control': 'no-store' } };
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return new NextResponse('UNAUTHORIZED', { status: 401, ...noStore });
    }

    const { id } = await params;

    const rows = await sql`
      SELECT id, channel, service_type, status, call_status, reference, phone, fields, transcript, events, created_at
      FROM public.form_submissions
      WHERE id = ${id} AND user_id = ${session.user.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return new NextResponse('NOT_FOUND', { status: 404, ...noStore });
    }

    return NextResponse.json(rows[0], noStore);
  } catch (error) {
    console.error('[submissions/:id] failed to load submission', error);
    return new NextResponse('INTERNAL_ERROR', { status: 500, ...noStore });
  }
}
