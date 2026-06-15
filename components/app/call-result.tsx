'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  PhoneCall,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { cn } from '@/lib/shadcn/utils';

type SubmissionStatus = 'pending' | 'calling' | 'completed' | 'failed';

interface Submission {
  id: string;
  channel: string;
  service_type: string;
  status: SubmissionStatus | string;
  reference: string | null;
  phone: string | null;
  fields: Record<string, unknown> | null;
  transcript: string | null;
  created_at: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 5 * 60 * 1000; // ~5 minutes

type ViewState = 'loading' | 'not_found' | 'error' | 'ready' | 'timed_out';

function isTerminal(status: string): boolean {
  return status === 'completed' || status === 'failed';
}

function serviceTitle(serviceType: string): string {
  return FORM_SCHEMAS[serviceType]?.title ?? serviceType;
}

export function CallResult({ submissionId }: { submissionId: string }) {
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [view, setView] = React.useState<ViewState>('loading');

  React.useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}`, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!active) return;

        if (res.status === 404) {
          setView('not_found');
          return;
        }
        if (!res.ok) {
          // Keep the last good state if we have one; otherwise surface an error.
          setView((prev) => (prev === 'ready' ? prev : 'error'));
        } else {
          const data = (await res.json()) as Submission;
          if (!active) return;
          setSubmission(data);
          setView('ready');

          if (isTerminal(data.status)) {
            return; // stop polling
          }
        }
      } catch {
        if (!active) return;
        setView((prev) => (prev === 'ready' ? prev : 'error'));
      }

      if (!active) return;
      if (Date.now() - startedAt >= MAX_POLL_MS) {
        setView('timed_out');
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [submissionId]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="w-full max-w-xl">
        <Content view={view} submission={submission} />
      </div>
    </div>
  );
}

function Content({
  view,
  submission,
}: {
  view: ViewState;
  submission: Submission | null;
}) {
  if (view === 'loading') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-5 py-10 text-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading your call…</p>
        </div>
      </Shell>
    );
  }

  if (view === 'not_found') {
    return (
      <StatusShell
        Icon={AlertTriangle}
        tone="muted"
        eyebrow="Not found"
        title="We couldn’t find this call"
        description="This request doesn’t exist or doesn’t belong to your account."
      >
        <BackToPortal />
      </StatusShell>
    );
  }

  if (view === 'error') {
    return (
      <StatusShell
        Icon={AlertTriangle}
        tone="muted"
        eyebrow="Connection issue"
        title="Couldn’t check the status"
        description="We had trouble reaching the server. Please refresh this page to try again."
      >
        <BackToPortal />
      </StatusShell>
    );
  }

  if (!submission) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-5 py-10 text-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading…</p>
        </div>
      </Shell>
    );
  }

  const reference = submission.reference;
  const status = submission.status;

  if (view === 'timed_out' && !isTerminal(status)) {
    return (
      <StatusShell
        Icon={PhoneCall}
        tone="muted"
        eyebrow={serviceTitle(submission.service_type)}
        title="Still in progress"
        description="This is taking longer than usual. Your call may still be ongoing — check your submissions later for the result."
        reference={reference}
      >
        <BackToPortal />
      </StatusShell>
    );
  }

  if (status === 'completed') {
    return <CompletedView submission={submission} />;
  }

  if (status === 'failed') {
    return (
      <StatusShell
        Icon={AlertTriangle}
        tone="destructive"
        eyebrow={serviceTitle(submission.service_type)}
        title="The call didn’t complete"
        description="We weren’t able to finish filling your form over the phone. You can try again."
        reference={reference}
      >
        <Button asChild size="lg" className="rounded-full">
          <Link href="/portal/call">Try again</Link>
        </Button>
        <BackToPortal variant="link" />
      </StatusShell>
    );
  }

  // pending / calling — waiting state
  return (
    <StatusShell
      Icon={PhoneCall}
      tone="primary"
      spinner
      eyebrow={serviceTitle(submission.service_type)}
      title={
        submission.phone
          ? `We’re calling you at ${submission.phone}…`
          : 'We’re calling you…'
      }
      description="Answer the call and speak naturally — this page updates automatically as the call progresses."
      reference={reference}
    />
  );
}

function CompletedView({ submission }: { submission: Submission }) {
  const schema = FORM_SCHEMAS[submission.service_type];
  const fields = submission.fields ?? {};

  const rows = schema
    ? schema.fields.map((field) => ({
        key: field.id,
        label: field.label,
        Icon: field.icon,
        value: fields[field.id],
      }))
    : Object.entries(fields).map(([key, value]) => ({
        key,
        label: key,
        Icon: FileText as React.ElementType,
        value,
      }));

  return (
    <Card className="border-primary gap-8 rounded-[2.5rem] p-10 shadow-sm">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="bg-primary flex h-16 w-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary-foreground h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            {serviceTitle(submission.service_type)}
          </span>
          <h1 className="text-foreground font-serif text-3xl font-normal tracking-[-0.02em]">
            Form filled successfully
          </h1>
        </div>
      </header>

      <div className="bg-muted/60 border-border flex items-center justify-between gap-3 rounded-2xl border px-5 py-4">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Reference
        </span>
        <span className="text-foreground font-mono text-sm font-bold">
          {submission.reference ?? '—'}
        </span>
      </div>

      <div className="space-y-3">
        <span className="text-muted-foreground block text-xs font-medium tracking-[0.2em] uppercase">
          Details
        </span>
        {rows.map(({ key, label, Icon, value }) => (
          <div
            key={key}
            className="bg-muted/60 border-border flex items-center gap-4 rounded-2xl border p-4"
          >
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <Icon size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground mb-0.5 text-xs font-medium tracking-[0.15em] uppercase">
                {label}
              </div>
              <div className="text-foreground truncate text-sm font-medium">
                {value !== undefined && value !== null && String(value).trim() !== ''
                  ? String(value)
                  : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button asChild size="lg" className="w-full rounded-full">
          <Link href="/portal">Done</Link>
        </Button>
      </div>
    </Card>
  );
}

/** Plain card shell. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-primary gap-8 rounded-[2.5rem] p-10 shadow-sm">{children}</Card>
  );
}

/** Standardised status card with an icon, copy, optional reference, and actions. */
function StatusShell({
  Icon,
  tone,
  spinner = false,
  eyebrow,
  title,
  description,
  reference,
  children,
}: {
  Icon: React.ElementType;
  tone: 'primary' | 'muted' | 'destructive';
  spinner?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  reference?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <Shell>
      <header className="flex flex-col items-center gap-5 text-center">
        <div
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-full',
            tone === 'primary' && 'bg-primary/10 text-primary',
            tone === 'muted' && 'bg-muted text-muted-foreground',
            tone === 'destructive' && 'bg-destructive/10 text-destructive'
          )}
        >
          <Icon className="h-8 w-8" />
          {spinner && (
            <Loader2 className="text-primary absolute -right-1 -bottom-1 h-6 w-6 animate-spin" />
          )}
        </div>
        <div className="space-y-2">
          <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            {eyebrow}
          </span>
          <h1 className="text-foreground font-serif text-3xl font-normal tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-sm text-base leading-relaxed font-light">
            {description}
          </p>
        </div>
        {(spinner || tone === 'primary') && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            Live — updates automatically
          </Badge>
        )}
      </header>

      {reference && (
        <div className="bg-muted/60 border-border flex items-center justify-between gap-3 rounded-2xl border px-5 py-4">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Reference
          </span>
          <span className="text-foreground font-mono text-sm font-bold">{reference}</span>
        </div>
      )}

      {children && <div className="flex flex-col items-center gap-3">{children}</div>}
    </Shell>
  );
}

function BackToPortal({ variant = 'outline' }: { variant?: 'outline' | 'link' }) {
  if (variant === 'link') {
    return (
      <Link
        href="/portal"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Back to portal
      </Link>
    );
  }
  return (
    <Button asChild size="lg" variant="outline" className="rounded-full">
      <Link href="/portal">
        <ArrowLeft size={16} />
        Back to portal
      </Link>
    </Button>
  );
}
