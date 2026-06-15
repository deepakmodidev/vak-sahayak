'use client';

import type { RinggEvent } from '@/lib/call-status';

function formatStamp(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' });
}

/**
 * Renders the raw Ringg webhook events exactly as received. Each row shows the
 * key fields (event_type · status · sub_status · time); expanding it reveals the
 * full raw JSON payload Ringg sent — for debugging the whole flow.
 */
export function RinggEvents({ events }: { events: RinggEvent[] | null | undefined }) {
  const list = Array.isArray(events) ? events : [];

  return (
    <div className="space-y-3">
      <span className="text-muted-foreground block text-xs font-medium tracking-[0.2em] uppercase">
        Ringg events ({list.length})
      </span>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events received from Ringg yet.</p>
      ) : (
        <div className="space-y-2">
          {list.map((event, index) => (
            <details
              key={index}
              className="bg-muted/60 border-border overflow-hidden rounded-2xl border"
            >
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 p-2 text-xs">
                <span className="text-foreground font-mono">
                  {String(event.event_type ?? 'event')}
                </span>
                {event.status != null && (
                  <span className="text-muted-foreground font-mono">· {String(event.status)}</span>
                )}
                {event.sub_status != null && (
                  <span className="text-muted-foreground font-mono">
                    · {String(event.sub_status)}
                  </span>
                )}
                {event.received_at && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {formatStamp(event.received_at)}
                  </span>
                )}
              </summary>
              <pre className="bg-background/60 border-border max-h-80 overflow-auto border-t p-4 font-mono text-xs leading-relaxed whitespace-pre">
                {JSON.stringify(event, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
