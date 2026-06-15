import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/app/auth/auth-form';
import { signInAction, signUpAction } from '@/app/auth/actions';
import { auth } from '@/lib/auth/server';

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
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-transparent px-6 py-16">
      <div className="pointer-events-none absolute bottom-0 left-0 z-0 w-full overflow-hidden opacity-60">
        <img
          src="/sarvam/hero-gradient.svg"
          alt=""
          className="h-auto w-full translate-y-2/3 scale-150 rotate-180 object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <img src="/vak-sahayak.png" alt="Vak Sahayak" className="h-9 w-auto" />
          <span className="font-serif text-2xl font-bold tracking-tight">Vak Sahayak</span>
        </Link>

        <div className="border-border rounded-3xl border bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl leading-tight tracking-tight">{copy.title}</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{copy.subtitle}</p>
          </div>
          <AuthForm mode={mode} action={mode === 'sign-up' ? signUpAction : signInAction} />
        </div>
      </div>
    </div>
  );
}
