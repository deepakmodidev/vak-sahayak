import { createNeonAuth, type NeonAuth } from '@neondatabase/auth/next/server';

/**
 * Shared server-side Neon Auth instance (Better Auth under the hood).
 *
 * Provides the Better Auth server methods (signIn, signUp, signOut, getSession),
 * plus `.handler()` (API route) and `.middleware()` (route protection).
 *
 * LAZY ON PURPOSE: `createNeonAuth()` validates its config eagerly and THROWS if
 * `cookies.secret` is missing or under 32 chars. To keep `next build` working
 * with no env vars set (env is runtime-only here), we construct the instance on
 * first property access via a Proxy instead of at module import. Call sites are
 * unchanged: `auth.getSession()`, `auth.handler()`, `auth.signIn.email(...)`.
 *
 * Anything that calls `auth.getSession()` in a Server Component must opt out of
 * static rendering with `export const dynamic = 'force-dynamic'`.
 */
let instance: NeonAuth | null = null;

function getAuth(): NeonAuth {
  if (!instance) {
    instance = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        // Must be at least 32 characters. From Neon Console → Auth → Configuration.
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    });
  }
  return instance;
}

export const auth = new Proxy({} as NeonAuth, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuth(), prop, receiver);
  },
}) as NeonAuth;
