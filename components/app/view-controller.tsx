'use client';

import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { FormVisualizer, type FormData } from '@/components/app/form-visualizer';

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
};

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
  const { resolvedTheme } = useTheme();

  const handleStartCall = (serviceId: string) => {
    onServiceSelect(serviceId);
    // Use setTimeout to ensure state is updated before token fetch if needed, 
    // though start() usually triggers asynchronously anyway.
    setTimeout(() => start(), 10);
  };

  return (
    <AnimatePresence mode="wait">
      {/* Welcome view */}
      {!isConnected && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          appConfig={appConfig}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
        />
      )}
      {/* Session view */}
      {isConnected && (
        <motion.div 
          key="session-root"
          className="fixed inset-0 flex flex-col items-center justify-center p-12 bg-background overflow-y-auto"
          {...VIEW_MOTION_PROPS}
        >
          {/* Global Header */}
          <div className="absolute top-0 left-0 w-full p-8 z-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/vak-sahayak.png" 
                alt="Vak Sahayak" 
                className="w-12 h-12 object-contain" 
              />
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight leading-none">Vak Sahayak</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1.5">
                  Voice Portal Active
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-12">
            {/* Left: Agent Visualization */}
            <div className="relative h-full flex items-center justify-center">
              <MotionSessionView
                key="session-view"
                supportsChatInput={appConfig.supportsChatInput}
                supportsVideoInput={appConfig.supportsVideoInput}
                supportsScreenShare={appConfig.supportsScreenShare}
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


