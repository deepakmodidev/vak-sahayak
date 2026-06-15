'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, LogOut, Mic, Phone } from 'lucide-react';
// eslint-disable-next-line import/named
import { motion } from 'motion/react';
import { authClient } from '@/lib/auth/client';
import { RinggEvents } from '@/components/app/ringg-events';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { isTerminalStatus, type RinggEvent } from '@/lib/call-status';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Submission {
  id: string;
  channel: string;
  service_type: string;
  status: string; // internal control status
  call_status: string | null; // RAW status straight from Ringg
  reference: string | null;
  fields: Record<string, unknown> | null;
  events: RinggEvent[] | null; // RAW events straight from Ringg
  created_at: string;
}

type LoadState = 'loading' | 'error' | 'ready';

function serviceTitle(serviceType: string): string {
  return FORM_SCHEMAS[serviceType]?.title ?? serviceType;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Shows the raw status string verbatim; a tick + tint for completed. */
function StatusBadge({ status }: { status: string }) {
  const isCompleted = status?.toLowerCase() === 'completed';
  return (
    <Badge
      variant="secondary"
      className={`gap-1.5 px-3 py-1 font-mono text-xs tracking-wide ${isCompleted ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'
        }`}
    >
      {isCompleted && <CheckCircle2 size={13} strokeWidth={2.5} />}
      {status || '—'}
    </Badge>
  );
}

function ChannelLabel({ channel }: { channel: string }) {
  // Voice = in-browser mic; call = phone. Matches the portal's voice/call icons.
  const Icon = channel === 'call' ? Phone : Mic;
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground gap-1 border-transparent px-0 text-xs font-medium tracking-[0.15em] uppercase"
    >
      <Icon size={12} strokeWidth={2.5} />
      {channel || 'voice'}
    </Badge>
  );
}

/** Renders the submitted field values for the detail modal. */
function SubmissionDetails({ submission }: { submission: Submission }) {
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
    <div className="space-y-3">
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
  );
}

export function SubmissionsHistory() {
  const { data: sessionData } = authClient.useSession();
  const userName = sessionData?.user?.name || sessionData?.user?.email || 'Account';

  const [state, setState] = useState<LoadState>('loading');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const MAX_REFRESH_MS = 5 * 60 * 1000; // stop auto-refreshing after ~5 min

    const load = async () => {
      try {
        const res = await fetch('/api/submissions', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as Submission[];
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setSubmissions(list);
        setState('ready');
        // Keep refreshing while any call is still in progress so the card
        // reflects ringing → on call → processing → completed live.
        if (
          list.some((s) => !isTerminalStatus(s.status)) &&
          Date.now() - startedAt < MAX_REFRESH_MS
        ) {
          timer = setTimeout(load, 4000);
        }
      } catch (error) {
        console.error('[submissions-history] failed to load', error);
        if (!active) return;
        // Only show the error state on first load; keep last good data after.
        setState((prev) => (prev === 'ready' ? prev : 'error'));
      }
    };

    load();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // ---- Loading ----
  if (state === 'loading') {
    return (
      <section className="font-sans">
        <SectionHeader title="Your Submissions" userName={userName} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card border-border h-40 animate-pulse rounded-3xl border"
            />
          ))}
        </div>
      </section>
    );
  }

  // ---- Error (degrade gracefully) ----
  if (state === 'error') {
    return (
      <section className="font-sans">
        <SectionHeader title="Your Submissions" userName={userName} />
        <p className="text-muted-foreground text-sm">Couldn&apos;t load submissions.</p>
      </section>
    );
  }

  // ---- Empty ----
  if (submissions.length === 0) {
    return (
      <section className="font-sans">
        <SectionHeader title="Your Submissions" userName={userName} />
        <Card className="rounded-3xl p-10">
          <CardContent className="px-0">
            <p className="text-muted-foreground max-w-md text-base leading-relaxed font-light">
              No submissions yet — fill a form by voice and it&apos;ll appear here.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // ---- List ----
  return (
    <section className="font-sans">
      <SectionHeader title="Your Submissions" userName={userName} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission, index) => (
          <motion.button
            key={submission.id}
            type="button"
            onClick={() => setSelected(submission)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
            className="group text-left"
          >
            <Card className="border-border hover:border-primary h-full gap-4 rounded-3xl py-6 transition-all duration-300 group-hover:scale-[1.01]">
              <CardHeader className="px-6">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-foreground font-serif text-xl leading-snug font-normal tracking-[-0.01em]">
                    {serviceTitle(submission.service_type)}
                  </CardTitle>
                  <StatusBadge status={submission.call_status ?? submission.status} />
                </div>
              </CardHeader>

              <CardContent className="px-6">
                <div className="bg-muted/60 border-border flex items-center gap-2 rounded-2xl border px-4 py-3">
                  <FileText className="text-primary shrink-0" size={15} />
                  <span className="text-foreground truncate font-mono text-sm font-medium tracking-tight">
                    {submission.reference ?? '—'}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="mt-auto flex items-center justify-between gap-3 px-6 pt-1">
                <ChannelLabel channel={submission.channel} />
                <span className="text-muted-foreground text-xs font-medium">
                  {formatDate(submission.created_at)}
                </span>
              </CardFooter>
            </Card>
          </motion.button>
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="bg-card flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-3xl border-0 p-8 font-sans sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader className="mb-6 gap-0 text-left">
                <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                  Submission
                </span>
                <DialogTitle className="text-foreground mt-2 font-serif text-3xl font-normal tracking-[-0.02em]">
                  {serviceTitle(selected.service_type)}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Details of your {serviceTitle(selected.service_type)} submission, reference{' '}
                  {selected.reference ?? 'unknown'}.
                </DialogDescription>
              </DialogHeader>

              <div className="-mr-2 flex-1 overflow-y-auto pr-2">
                <div className="bg-muted/60 border-border mb-6 space-y-3 rounded-2xl border p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Reference
                    </span>
                    <span className="text-foreground font-mono text-sm">
                      {selected.reference ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Status
                    </span>
                    <StatusBadge status={selected.call_status ?? selected.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Channel
                    </span>
                    <ChannelLabel channel={selected.channel} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Submitted
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {formatDate(selected.created_at)}
                    </span>
                  </div>
                </div>

                <span className="text-muted-foreground mb-3 block text-xs font-medium tracking-[0.2em] uppercase">
                  Details
                </span>
                <SubmissionDetails submission={selected} />

                {selected.channel === 'call' && (
                  <div className="mt-6">
                    <RinggEvents events={selected.events} />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SectionHeader({ title, userName }: { title: string; userName: string }) {
  const initial = userName.trim().charAt(0).toUpperCase() || 'A';
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } catch {
      // Best-effort: redirect to the auth page regardless.
    }
    window.location.href = '/auth';
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          History
        </span>
        <h2 className="text-foreground mt-2 font-serif text-4xl font-normal tracking-[-0.02em]">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium">
          <span className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium">
            {initial}
          </span>
          <span className="max-w-[12rem] truncate">{userName}</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          <LogOut size={14} strokeWidth={2.5} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
}
