import { redirect } from 'next/navigation';
import { AuthForm } from '@/app/auth/auth-form';
import { AuthShell } from '@/app/auth/auth-shell';
import { signInAction, signUpAction } from '@/app/auth/actions';
import { auth } from '@/lib/auth/server';

// Reads the session to redirect already-authenticated users, so render dynamically.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return {
    title:
      (await searchParams).mode === 'sign-up'
        ? 'Create account · Vak Sahayak'
        : 'Sign in · Vak Sahayak',
  };
}

/**
 * Single auth page. Switches between sign-in and sign-up via `?mode=`.
 * Any value other than `sign-up` falls back to sign-in.
 */
export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const mode = (await searchParams).mode === 'sign-up' ? 'sign-up' : 'sign-in';

  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect('/portal');
  }

  const copy =
    mode === 'sign-up'
      ? {
          title: 'Create your account',
          subtitle: 'Join Vak Sahayak to fill government forms with your voice.',
        }
      : {
          title: 'Welcome back',
          subtitle: 'Sign in to access your Vak Sahayak portal and submission history.',
        };

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle}>
      <AuthForm mode={mode} action={mode === 'sign-up' ? signUpAction : signInAction} />
    </AuthShell>
  );
}
