'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export type AuthActionState = { error: string } | null;

/**
 * Email/password sign-in server action. On success redirects to /portal.
 * `redirect()` throws internally, so it must live outside the try/catch.
 */
export async function signInAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Please enter your email and password.' };
  }

  try {
    const { error } = await auth.signIn.email({ email, password });
    if (error) {
      return { error: error.message || 'Sign-in failed. Check your credentials.' };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong.' };
  }

  redirect('/portal');
}

/**
 * Email/password sign-up server action. Better Auth's email sign-up requires a
 * `name`. On success redirects to /portal.
 */
export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !email || !password) {
    return { error: 'Please fill in your name, email and password.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  try {
    const { error } = await auth.signUp.email({ email, password, name });
    if (error) {
      return { error: error.message || 'Sign-up failed. Please try again.' };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong.' };
  }

  redirect('/portal');
}
