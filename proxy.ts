import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

// Next.js 16 renamed the middleware convention to `proxy.ts` (exporting `proxy`).
// The Neon Auth `auth.middleware()` returns a standard
// `(req: NextRequest) => Promise<NextResponse>`, which is exactly the proxy shape.
// It redirects unauthenticated requests to `loginUrl` and refreshes the session.
//
// `auth.middleware()` is resolved per-request (lazily) so the auth instance only
// constructs at runtime — keeps `next build` working without auth env vars set.
//
// The server-side gate in `app/portal/layout.tsx` is the AUTHORITATIVE check;
// this proxy is an early redirect for a nicer UX. The proxy runtime is nodejs.
export function proxy(request: NextRequest) {
  return auth.middleware({ loginUrl: '/auth' })(request);
}

export const config = {
  // Gate the whole /portal subtree (today's page + future /portal/voice, /portal/call).
  matcher: ['/portal/:path*'],
};
