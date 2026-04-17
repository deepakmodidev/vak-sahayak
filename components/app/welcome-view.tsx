import React from 'react';
import { Button } from '@/components/ui/button';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import type { AppConfig } from '@/app-config';

function WelcomeIcon({ color }: { color?: string }) {
  return (
    <div className="relative mb-6">
      <div 
        className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${color || 'var(--primary)'}, #000)`,
        }}
      >
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        <Landmark size={48} className="text-white drop-shadow-lg" />
      </div>
    </div>
  );
}

interface WelcomeViewProps {
  appConfig: AppConfig;
  startButtonText: string;
  onStartCall: (serviceId: string) => void;
  className?: string;
}

export const WelcomeView = ({
  appConfig,
  startButtonText,
  onStartCall,
  className,
}: WelcomeViewProps) => {
  const primaryColor = appConfig.accent || 'var(--primary)';
  const [selectedService, setSelectedService] = React.useState('aadhaar');

  const services = [
    { id: 'aadhaar', name: 'Aadhaar', description: 'Address/Name' },
    { id: 'pan', name: 'PAN Card', description: 'New/Correction' },
    { id: 'ration', name: 'Ration Card', description: 'Member Update' }
  ];

  const handleStart = () => {
    onStartCall(selectedService);
  };

  return (
    <div className={cn("px-6 min-h-[85vh] flex items-center justify-center py-12", className)}>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto w-full">
        {/* Left Side: Branding */}
        <div className="flex flex-col items-start text-left h-full justify-between py-6">
          <div className="space-y-8">
            <WelcomeIcon color={primaryColor} />
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
                Vak <span style={{ color: primaryColor }}>Sahayak</span>
              </h1>
              <p className="text-xl text-white max-w-md leading-relaxed font-medium">
                {appConfig.pageDescription}
              </p>
            </div>
          </div>

          <div className="pt-12 mt-auto">
            <div className="flex items-center gap-4">
              <img 
                src="https://cdn.brandfetch.io/idIGw-JqnV/w/200/h/200/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1775196648472" 
                alt="Sarvam Icon" 
                className="w-16 h-16 rounded-xl"
              />
              <div className="flex flex-col items-start gap-1">
                <span className="text-md text-white uppercase font-black tracking-[0.2em] mb-1">Powered by</span>
                <img 
                  src="https://cdn.brandfetch.io/idIGw-JqnV/w/606/h/96/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B" 
                  alt="Sarvam AI" 
                  className="h-6 w-auto mix-blend-screen grayscale contrast-[10] brightness-[10]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interaction */}
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] flex flex-col gap-8 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">Select Service</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={cn(
                    "p-5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group",
                    selectedService === service.id 
                      ? "bg-white/10 border-white/20" 
                      : "bg-transparent border-white/5 hover:bg-white/[0.05]"
                  )}
                >
                  <div>
                    <h3 className="text-white font-semibold text-base">{service.name}</h3>
                    <p className="text-white/30 text-[10px] mt-1">{service.description}</p>
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    selectedService === service.id ? "bg-white shadow-[0_0_12px_white]" : "bg-white/10"
                  )} />
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            style={{ backgroundColor: primaryColor }}
            className="w-full rounded-2xl h-16 font-bold text-lg text-white transition-all hover:opacity-90 active:scale-[0.98] border-none shadow-none"
          >
            {startButtonText}
          </Button>
        </div>
      </section>
    </div>
  );
};
