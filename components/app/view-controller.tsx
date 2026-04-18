'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
// eslint-disable-next-line import/named
import { AnimatePresence, motion } from 'motion/react';
import { useRemoteParticipants, useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { type FormData, FormVisualizer } from '@/components/app/form-visualizer';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
} as const;

interface ViewControllerProps {
  appConfig: AppConfig;
  formData: FormData;
  activeField: string | null;
  isSubmitted: boolean;
  serviceType: string;
  onServiceSelect: (id: string) => void;
}

export function ViewController({
  appConfig,
  formData,
  activeField,
  isSubmitted,
  serviceType,
  onServiceSelect,
}: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const remoteParticipants = useRemoteParticipants();
  const { resolvedTheme } = useTheme();
  const [isConnecting, setIsConnecting] = useState(false);

  // In this app, the agent is the only remote participant.
  // We strictly wait for at least one remote participant to join.
  const agentParticipant = remoteParticipants[0];
  const isAgentReady = isConnected && !!agentParticipant;

  const handleStartCall = (serviceId: string) => {
    onServiceSelect(serviceId);
    setIsConnecting(true);
    setTimeout(() => start(), 10);
  };

  // Reset locally tracked connecting state once agent is ready
  useEffect(() => {
    if (isAgentReady) {
      setIsConnecting(false);
    }
  }, [isAgentReady]);

  return (
    <AnimatePresence mode="wait">
      {/* Welcome view stays until agent is actually ready */}
      {!isAgentReady && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          appConfig={appConfig}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
          isConnecting={isConnecting}
        />
      )}
      {/* Session view only shows once agent joined */}
      {isAgentReady && (
        <motion.div
          key="session-root"
          className="bg-background fixed inset-0 flex flex-col items-center justify-center overflow-y-auto p-12"
          {...VIEW_MOTION_PROPS}
        >
          {/* Global Header */}
          <div className="absolute top-0 left-0 z-50 flex w-full items-center justify-between p-8">
            <div className="flex items-center gap-3">
              <img src="/vak-sahayak.png" alt="Vak Sahayak" className="h-12 w-12 object-contain" />
              <div>
                <h2 className="text-foreground text-xl leading-none font-semibold tracking-tight">
                  Vak Sahayak
                </h2>
                <p className="text-muted-foreground mt-1.5 text-xs font-medium tracking-[0.2em] uppercase">
                  Voice Portal Active
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left: Agent Visualization */}
            <div className="relative flex h-full items-center justify-center">
              <MotionSessionView
                key="session-view"
                supportsChatInput={appConfig.supportsChatInput}
                isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
                audioVisualizerType={appConfig.audioVisualizerType}
                audioVisualizerColor={
                  resolvedTheme === 'dark'
                    ? appConfig.audioVisualizerColorDark
                    : ('var(--primary)' as `#${string}`)
                }
                audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
                audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
                audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
                audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
                audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
                audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
                audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
                className="w-full"
              />
            </div>

            {/* Right: Interaction State (Tracker or Success) */}
            <FormVisualizer
              data={formData}
              activeField={activeField}
              isSubmitted={isSubmitted}
              appConfig={appConfig}
              serviceType={serviceType}
              onReset={() => window.location.reload()}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
