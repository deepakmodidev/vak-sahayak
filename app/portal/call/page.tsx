'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_SERVICE, FORM_SCHEMAS } from '@/lib/form-schemas';
import { cn } from '@/lib/shadcn/utils';

const E164 = /^\+\d{8,15}$/;

const SERVICES = Object.entries(FORM_SCHEMAS).map(([id, schema]) => ({
  id,
  title: schema.title,
}));

export default function CallRequestPage() {
  const router = useRouter();

  const [selectedService, setSelectedService] = React.useState<string>(DEFAULT_SERVICE);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('+91');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notConfigured, setNotConfigured] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setNotConfigured(false);

    const trimmedPhone = phone.trim();
    if (!E164.test(trimmedPhone)) {
      setError('Enter a valid phone number in international format, e.g. +9198XXXXXXXX.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/call/initiate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: selectedService,
          phone: trimmedPhone,
          name: name.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { submissionId: string };
        router.push(`/portal/call/${data.submissionId}`);
        return;
      }

      if (res.status === 503) {
        setNotConfigured(true);
        return;
      }

      const message = await res.text().catch(() => '');
      if (res.status === 400) {
        setError(
          message?.startsWith('INVALID_PHONE')
            ? 'Enter a valid phone number in international format, e.g. +9198XXXXXXXX.'
            : 'Please choose a valid service and phone number.'
        );
      } else if (res.status === 401) {
        setError('Your session has expired — please sign in again.');
      } else {
        setError('We couldn’t start the call right now. Please try again in a moment.');
      }
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col px-6 py-12 font-sans">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/portal"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <section className="text-foreground grid grid-cols-1 items-center gap-16 lg:min-h-[70vh] lg:grid-cols-2 lg:gap-24">
          {/* Left Side: Branding */}
          <div className="flex flex-col items-start gap-12 py-8 text-left">
            <div className="space-y-8">
              <img src="/vak-sahayak.png" alt="Vak Sahayak Logo" className="h-auto w-24" />
              <div>
                <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                  Phone Call
                </span>
                <h1 className="text-foreground mt-4 mb-6 font-serif text-5xl leading-[0.95] font-normal tracking-[-0.03em] md:text-6xl">
                  Fill by <span className="text-primary/60">phone call</span>
                </h1>
                <p className="text-muted-foreground max-w-md text-xl leading-relaxed font-light">
                  Pick a service and enter your number — we&apos;ll call you and fill the form
                  together.
                </p>
              </div>
            </div>

            {/* Powered by Ringg AI */}
            <div>
              <div className="flex flex-col gap-6">
                <span className="text-foreground text-xl font-medium tracking-widest uppercase">
                  Powered by
                </span>
                <img src="/ringg/ringg-logo.svg" alt="Ringg AI" className="h-8 w-auto" />
              </div>
            </div>
          </div>

          {/* Right Side: Interaction */}
          <Card className="bg-card border-primary flex flex-col gap-10 rounded-[3rem] border p-10 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Service picker */}
              <div className="space-y-4">
                <span className="text-foreground text-xs font-medium tracking-[0.2em] uppercase">
                  Select Service
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {SERVICES.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedService(service.id)}
                      className={cn(
                        'group flex items-center justify-between rounded-2xl border p-5 text-left transition-all duration-300',
                        selectedService === service.id
                          ? 'bg-primary text-primary-foreground border-primary scale-[1.01]'
                          : 'bg-card border-border hover:border-primary hover:bg-muted',
                        submitting && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <span
                        className={cn(
                          'text-base font-medium transition-colors',
                          selectedService === service.id
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        )}
                      >
                        {service.title}
                      </span>
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full transition-all duration-300',
                          selectedService === service.id ? 'bg-primary-foreground' : 'bg-muted'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Your name <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    disabled={submitting}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+9198XXXXXXXX"
                    required
                    disabled={submitting}
                    aria-invalid={Boolean(error)}
                    className="h-12 rounded-xl"
                  />
                  <p className="text-muted-foreground text-xs">
                    International format with country code, e.g. +9198XXXXXXXX.
                  </p>
                </div>
              </div>

              {notConfigured && (
                <div className="bg-muted text-foreground border-border rounded-2xl border p-4 text-sm font-medium">
                  Phone calling isn&apos;t enabled yet — set up Ringg to use this. You can still fill
                  your form{' '}
                  <Link href="/portal/voice" className="text-primary underline underline-offset-4">
                    by voice
                  </Link>
                  .
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-2xl p-4 text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-14 w-full rounded-full text-lg font-medium shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Calling you…
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5" />
                    Call me
                  </>
                )}
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}
