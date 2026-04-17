import React from 'react';
import { Button } from '@/components/ui/button';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import type { AppConfig } from '@/app-config';

function WelcomeIcon() {
  return (
    <div className="relative mb-8">
      <img 
        src="/vak-sahayak.png" 
        alt="Vak Sahayak Logo" 
        className="w-24 h-auto"
      />
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
    <div className={cn("px-6 min-h-[85vh] flex items-center justify-center py-12 bg-background font-sans", className)}>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center max-w-6xl mx-auto w-full text-foreground">
        {/* Left Side: Branding */}
        <div className="flex flex-col items-start text-left h-full justify-between py-8">
          <div className="space-y-10">
            <WelcomeIcon />
            <div>
              <h1 className="text-6xl md:text-8xl font-serif font-normal text-foreground mb-8 tracking-[-0.03em] leading-[0.95]">
                Vak <span className="text-primary/60">Sahayak</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-md leading-relaxed font-light">
                {appConfig.pageDescription}
              </p>
            </div>
          </div>

          <div className="pt-16 mt-auto">
            <div className="flex flex-col gap-6">
              <span className="text-xl text-foreground uppercase font-medium tracking-widest">Powered by</span>
              <div className="flex items-center gap-6">
                <img 
                  src="https://media.brand.dev/8eaa65e9-6bb4-49e2-9cef-d45fcfbe6f39.svg" 
                  alt="Sarvam Icon" 
                  className="w-10 h-10"
                />
                <div className="w-px h-8 bg-foreground" />
                <img 
                  src="https://assets.sarvam.ai/assets/svgs/sarvam-wordmark-black.svg" 
                  alt="Sarvam AI" 
                  className="h-6 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interaction */}
        <div className="bg-card border border-primary p-10 rounded-[3rem] flex flex-col gap-10 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-foreground uppercase font-medium tracking-[0.2em]">Select Service</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={cn(
                    "p-6 rounded-[1.5rem] border text-left transition-all duration-300 flex items-center justify-between group",
                    selectedService === service.id 
                      ? "bg-primary text-primary-foreground border-primary scale-[1.02]" 
                      : "bg-card border-primary hover:border-primary hover:bg-muted"
                  )}
                >
                  <div>
                    <h3 className={cn(
                      "font-medium text-lg transition-colors",
                      selectedService === service.id ? "text-primary-foreground" : "text-foreground"
                    )}>{service.name}</h3>
                    <p className={cn(
                      "text-xs mt-1 transition-colors",
                      selectedService === service.id ? "text-primary-foreground" : "text-foreground"
                    )}>{service.description}</p>
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                    selectedService === service.id ? "bg-primary-foreground" : "bg-muted"
                  )} />
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="w-full rounded-[1.5rem] h-16 font-semibold text-xl bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] transition-all border-none shadow-sm"
          >
            {startButtonText}
          </Button>
        </div>
      </section>
    </div>
  );
};
