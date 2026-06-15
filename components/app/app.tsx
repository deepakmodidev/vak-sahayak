'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RoomEvent, TokenSource, type RemoteParticipant } from 'livekit-client';
import { toast } from 'sonner';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import type { FormData } from '@/components/app/form-visualizer';
import { ViewController } from '@/components/app/view-controller';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

/** Messages the agent publishes over the data channel (see agent.ts publishUpdate). */
type AgentMessage =
  | { type: 'form_update'; payload: Record<string, string> }
  | { type: 'form_focus'; payload: { fieldId: string } }
  | { type: 'form_submitted'; payload: { status: string } }
  | { type: 'agent_error'; payload: { message: string } };

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const [formData, setFormData] = useState<FormData>({});
  // Mirror formData into a ref so the (room-scoped) data handler always reads the
  // latest accumulated answers when persisting on submit, without re-binding the
  // effect on every keystroke.
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serviceType, setServiceType] = useState('aadhaar');
  const serviceTypeRef = useRef(serviceType);

  // Keep ref in sync
  useEffect(() => {
    serviceTypeRef.current = serviceType;
  }, [serviceType]);

  // Mirror submission state into a ref so the disconnect handler reads the latest value.
  const isSubmittedRef = useRef(isSubmitted);
  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Sticky Sessions: Generate IDs once per page load strictly on the frontend
  const { sessionId, pId } = useMemo(() => ({
    sessionId: `room_${Math.random().toString(36).slice(2, 7)}`,
    pId: `user_${Math.random().toString(36).slice(2, 7)}`,
  }), []);

  // Track if the user explicitly clicked start to avoid eager dispatch on mount
  const dispatchRequested = useRef(false);

  const tokenSource = useMemo(() => {
    return TokenSource.custom(async () => {
      // Connection state machine — ONE rule: no token (and therefore no agent dispatch)
      // until the user clicks Start. This blocks LiveKit's pre-connect warm-up, which
      // would otherwise mint a token with the DEFAULT form before the user has chosen one.
      if (!dispatchRequested.current) {
        throw new Error('NOT_STARTED'); // pre-connect warm-up: skip until Start
      }
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_config: {},
          serviceType: serviceTypeRef.current, // the form the user picked at Start
          dispatch: true, // we only reach here on Start → summon the agent
          roomName: sessionId,
          participantIdentity: pId,
        }),
      });
      if (!res.ok) throw new Error('Token fetch failed');
      return res.json();
    });
  }, [sessionId, pId]); // Session-stable dependencies

  const session = useSession(tokenSource);

  // Sync form data from the agent over the data channel.
  useEffect(() => {
    const room = session.room;
    if (!room) return;

    const decoder = new TextDecoder();

    const labelFor = (fieldId: string): string => {
      const fields = FORM_SCHEMAS[serviceTypeRef.current]?.fields ?? [];
      return fields.find((f) => f.id === fieldId)?.label ?? fieldId;
    };

    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      // Only trust packets from the agent — every browser in the room can publish data.
      if (participant && !participant.isAgent) return;

      let msg: AgentMessage;
      try {
        msg = JSON.parse(decoder.decode(payload)) as AgentMessage;
      } catch (err) {
        console.error('Bad data packet from agent:', err);
        return;
      }

      switch (msg.type) {
        case 'form_update': {
          const fields = msg.payload ?? {};
          setFormData((prev) => ({ ...prev, ...fields }));
          const firstId = Object.keys(fields)[0];
          if (firstId) toast.info(`Updated: ${labelFor(firstId)}`);
          setActiveField(null);
          setSessionError(null); // a fresh update means the session is healthy again
          break;
        }
        case 'form_focus': {
          setActiveField(msg.payload?.fieldId ?? null);
          break;
        }
        case 'form_submitted': {
          // Fire-and-forget: persist the submission for the user's history.
          // Non-blocking and must never break the existing UX if it fails.
          fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceType: serviceTypeRef.current,
              formData: formDataRef.current,
            }),
          }).catch(() => {});
          setIsSubmitted(true);
          toast.success('Government form submitted successfully!');
          break;
        }
        case 'agent_error': {
          const message = msg.payload?.message ?? 'The voice agent hit an error.';
          setSessionError(message);
          toast.error(`Agent Error: ${message}`);
          break;
        }
        default: {
          console.warn('Unhandled agent message type:', (msg as { type?: string })?.type);
        }
      }
    };

    const handleDisconnected = () => {
      setActiveField(null);
      // Distinguish an intentional post-submit teardown from an unexpected drop.
      if (!isSubmittedRef.current) {
        toast.info('Voice session ended.');
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [session.room]);

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController
          appConfig={appConfig}
          formData={formData}
          activeField={activeField}
          isSubmitted={isSubmitted}
          serviceType={serviceType}
          externalError={sessionError}
          onServiceSelect={(type) => {
            dispatchRequested.current = true; // Signal that the next token fetch should summon the agent
            setServiceType(type);
            serviceTypeRef.current = type; // Synchronous update for token boundary
            setFormData({});
            setActiveField(null);
            setIsSubmitted(false);
            setSessionError(null);
          }}
        />
      </main>

      <StartAudioButton label="Start Voice Assistant" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}
