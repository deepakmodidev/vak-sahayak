'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RinggEvents } from '@/components/app/ringg-events';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { isTerminalStatus, type RinggEvent, type SubmissionStatus } from '@/lib/call-status';

interface Submission {
  id: string;
  channel: string;
  service_type: string;
  status: SubmissionStatus | string; // internal control status
  call_status: string | null; // RAW status straight from Ringg
  reference: string | null;
  phone: string | null;
  fields: Record<string, unknown> | null;
  transcript: unknown; // jsonb; not rendered
  events: RinggEvent[] | null; // RAW events straight from Ringg
  created_at: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 5 * 60 * 1000; // ~5 minutes
// Right after the row is created the GET can 404 briefly (read-after-write).
// Keep polling through this window before declaring it genuinely not found.
const NOT_FOUND_GRACE_MS = 15 * 1000;

type ViewState = 'loading' | 'not_found' | 'error' | 'ready' | 'timed_out';

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
          // Transient right after creation — retry within the grace window.
          if (Date.now() - startedAt < NOT_FOUND_GRACE_MS) {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            setView('not_found');
          }
          return;
        }
        if (!res.ok) {
          setView((prev) => (prev === 'ready' ? prev : 'error'));
        } else {
          const data = (await res.json()) as Submission;
          if (!active) return;
          setSubmission(data);
          setView('ready');

          if (isTerminalStatus(data.status)) {
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
    <div className="bg-background flex min-h-screen flex-col items-center px-6 py-16 font-sans">
      <div className="w-full max-w-xl">
        <Link
          href="/portal"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to portal
        </Link>
        <Content view={view} submission={submission} />
      </div>
    </div>
  );
}

function Content({ view, submission }: { view: ViewState; submission: Submission | null }) {
  if (view === 'loading' || (view === 'ready' && !submission) || (view === 'timed_out' && !submission)) {
    return (
      <Shell>
        <p className="text-muted-foreground text-sm font-medium">Loading your call…</p>
      </Shell>
    );
  }

  if (view === 'not_found') {
    return (
      <Shell>
        <Eyebrow>Not found</Eyebrow>
        <h1 className="text-foreground font-serif text-2xl">We couldn’t find this call</h1>
        <p className="text-muted-foreground text-sm">
          This request doesn’t exist or doesn’t belong to your account.
        </p>
      </Shell>
    );
  }

  if (view === 'error') {
    return (
      <Shell>
        <Eyebrow>Connection issue</Eyebrow>
        <h1 className="text-foreground font-serif text-2xl">Couldn’t check the status</h1>
        <p className="text-muted-foreground text-sm">
          We had trouble reaching the server. Refresh this page to try again.
        </p>
      </Shell>
    );
  }

  if (!submission) {
    return (
      <Shell>
        <p className="text-muted-foreground text-sm font-medium">Loading…</p>
      </Shell>
    );
  }

  const terminal = isTerminalStatus(submission.status);
  // Show Ringg's raw status verbatim. Fall back to our internal control status
  // only when Ringg hasn't reported anything yet (e.g. voice rows).
  const rawStatus = submission.call_status ?? submission.status ?? '—';

  return (
    <Card className="border-primary gap-8 rounded-[2.5rem] p-10 shadow-sm">
      <header className="space-y-3">
        <Eyebrow>{serviceTitle(submission.service_type)}</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground font-mono text-3xl font-medium tracking-tight">
            {rawStatus}
          </h1>
          {!terminal && view !== 'timed_out' && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
              Live
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {terminal
            ? 'Final status reported by Ringg for this call.'
            : view === 'timed_out'
              ? 'Still in progress — this can take a while. The latest status from Ringg is shown above; check back from your submissions.'
              : 'This is the live status straight from Ringg. The page updates automatically.'}
        </p>
      </header>

      <InfoBlock submission={submission} />

      {submission.status === 'completed' && <ExtractedFields submission={submission} />}

      {submission.status === 'failed' && (
        <div className="flex flex-col items-start gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/portal/call">Try again</Link>
          </Button>
        </div>
      )}

      <RinggEvents events={submission.events} />
    </Card>
  );
}

function InfoBlock({ submission }: { submission: Submission }) {
  const rows: Array<[string, string]> = [
    ['Reference', submission.reference ?? '—'],
    ['Phone', submission.phone ?? '—'],
    ['Ringg status', submission.call_status ?? '—'],
  ];
  return (
    <div className="bg-muted/60 border-border space-y-3 rounded-2xl border p-5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {label}
          </span>
          <span className="text-foreground font-mono text-sm font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

function ExtractedFields({ submission }: { submission: Submission }) {
  const schema = FORM_SCHEMAS[submission.service_type];
  const fields = submission.fields ?? {};

  const rows = schema
    ? schema.fields.map((field) => ({ key: field.id, label: field.label, value: fields[field.id] }))
    : Object.entries(fields).map(([key, value]) => ({ key, label: key, value }));

  return (
    <div className="space-y-3">
      <Eyebrow>Extracted fields</Eyebrow>
      {rows.map(({ key, label, value }) => (
        <div
          key={key}
          className="bg-muted/60 border-border flex items-center justify-between gap-4 rounded-2xl border p-4"
        >
          <span className="text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase">
            {label}
          </span>
          <span className="text-foreground truncate text-sm font-medium">
            {value !== undefined && value !== null && String(value).trim() !== ''
              ? String(value)
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-primary gap-3 rounded-[2.5rem] p-10 shadow-sm">{children}</Card>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground block text-xs font-medium tracking-[0.2em] uppercase">
      {children}
    </span>
  );
}
