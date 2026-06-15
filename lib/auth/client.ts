'use client';

import { createAuthClient } from '@neondatabase/auth/next';

/**
 * Client-side Neon Auth instance.
 *
 * The Next.js `createAuthClient()` takes no arguments — it talks to the local
 * `/api/auth/[...path]` proxy route and ships the Better Auth React adapter, so
 * `authClient.useSession()` is available in client components.
 */
export const authClient = createAuthClient();
