'use client';

import { useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';

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
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractResume = async (file: File) => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resume-extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract resume');
      }

      const data = await response.json();
      setResumeText(data.text);
      toast.success('Resume processed successfully');
    } catch (error) {
      console.error(error);
      toast.error('Could not process resume');
    } finally {
      setIsExtracting(false);
    }
  };

  const tokenSource = useMemo(() => {
    return TokenSource.custom(async () => {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeText || '', room_config: {} }),
      });
      if (!res.ok) throw new Error('Token fetch failed');
      return res.json();
    });
  }, [resumeText]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController
          appConfig={appConfig}
          onExtractResume={handleExtractResume}
          resumeAttached={!!resumeText}
          isExtracting={isExtracting}
        />
      </main>
      <StartAudioButton label="Start Audio" />
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
