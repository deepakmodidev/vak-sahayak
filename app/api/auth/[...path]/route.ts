import { auth } from '@/lib/auth/server';

// Neon Auth proxy route. The catch-all segment MUST be named `path` — the SDK
// handler reads `params.path` (string[]). Mounted at /api/auth/*.
//
// `auth.handler()` is resolved per-request (not at module load) so this route
// imports cleanly during `next build` when no auth env vars are set — the auth
// instance only constructs on first use.
type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: RouteParams): Promise<Response> {
  return auth.handler().GET(request, ctx);
}

export async function POST(request: Request, ctx: RouteParams): Promise<Response> {
  return auth.handler().POST(request, ctx);
}
