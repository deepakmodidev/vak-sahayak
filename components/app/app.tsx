'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RoomEvent, TokenSource } from 'livekit-client';
import { toast } from 'sonner';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import type { FormData } from '@/components/app/form-visualizer';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

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
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serviceType, setServiceType] = useState('aadhaar');
  const serviceTypeRef = useRef(serviceType);

  // Keep ref in sync
  useEffect(() => {
    serviceTypeRef.current = serviceType;
  }, [serviceType]);

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
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_config: {},
          serviceType: serviceTypeRef.current,
          dispatch: dispatchRequested.current,
          roomName: sessionId,
          participantIdentity: pId,
        }),
      });
      if (!res.ok) throw new Error('Token fetch failed');
      return res.json();
    });
  }, [sessionId, pId]); // Session-stable dependencies

  const session = useSession(tokenSource);

  // Sync Form Data from Agent via Data Packets
  useEffect(() => {
    const room = session.room;
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'form_update') {
          setFormData((prev) => ({ ...prev, ...data.payload }));
          toast.info(`Updated: ${Object.keys(data.payload)[0]}`);
          // Clear focus when updated
          setActiveField(null);
        } else if (data.type === 'form_focus') {
          setActiveField(data.payload.fieldId);
        } else if (data.type === 'form_submitted') {
          setIsSubmitted(true);
          toast.success('Government form submitted successfully!');
        } else if (data.type === 'agent_error') {
          const msg = data.payload.message;
          setSessionError(msg);
          toast.error(`Agent Error: ${msg}`);
        }
      } catch (err) {
        console.error('Error parsing data packet:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
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
