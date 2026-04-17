'use client';

import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import { Landmark } from 'lucide-react';
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
  isSubmitted: boolean;
  onServiceSelect: (id: string) => void;
}

export function ViewController({
  appConfig,
  formData,
  isSubmitted,
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
          className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0b]"
          {...VIEW_MOTION_PROPS}
        >
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
                    : appConfig.audioVisualizerColor
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
              
              <div className="absolute top-0 left-0 p-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Landmark size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Vak Sahayak</h2>
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest leading-none mt-1">
                      Voice Portal Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form Visualizer */}
            <div className="flex justify-center">
              <FormVisualizer 
                data={formData} 
                isSubmitted={isSubmitted} 
                appConfig={appConfig}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


