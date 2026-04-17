'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { TokenSource, RoomEvent } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import type { FormData } from '@/components/app/form-visualizer';

import { toast } from 'sonner';

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

  const tokenSource = useMemo(() => {
    return TokenSource.custom(async () => {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_config: {},
          serviceType: serviceTypeRef.current 
        }),
      });
      if (!res.ok) throw new Error('Token fetch failed');
      return res.json();
    });
  }, []);

  const session = useSession(
    tokenSource
  );

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
          onServiceSelect={(type) => {
            setServiceType(type);
            serviceTypeRef.current = type; // Synchronous update for token boundary
            setFormData({});
            setActiveField(null);
            setIsSubmitted(false);
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

