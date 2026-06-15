'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

/**
 * Signs the current user out and returns to the auth page.
 * Resilient: even if the upstream sign-out errors, we still redirect.
 */
export async function signOutAction() {
  try {
    await auth.signOut();
  } catch {
    // Ignore — clearing the local session is best-effort; redirect regardless.
  }
  redirect('/auth');
}
