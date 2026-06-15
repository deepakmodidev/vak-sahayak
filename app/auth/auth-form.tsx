'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { AuthActionState } from '@/app/auth/actions';

type AuthAction = (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>;

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  action: AuthAction;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-12 w-full rounded-full text-base font-semibold"
    >
      {pending ? 'Please wait…' : label}
    </Button>
  );
}

const inputClasses =
  'border-border focus-visible:border-primary focus-visible:ring-primary/30 h-12 w-full rounded-xl border bg-white px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus-visible:ring-[3px]';

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(action, null);
  const isSignUp = mode === 'sign-up';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isSignUp && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-foreground text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Your name"
            className={inputClasses}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-foreground text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-foreground text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          required
          minLength={isSignUp ? 8 : undefined}
          placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
          className={inputClasses}
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          {state.error}
        </p>
      )}

      <div className="mt-2">
        <SubmitButton label={isSignUp ? 'Create account' : 'Sign in'} />
      </div>

      <p className="text-muted-foreground mt-2 text-center text-sm">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link href="/auth?mode=sign-in" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Vak Sahayak?{' '}
            <Link href="/auth?mode=sign-up" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
