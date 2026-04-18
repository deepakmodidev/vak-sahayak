import React from 'react';
import type { AppConfig } from '@/app-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

function WelcomeIcon() {
  return (
    <div className="relative mb-8">
      <img src="/vak-sahayak.png" alt="Vak Sahayak Logo" className="h-auto w-24" />
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
    { id: 'ration', name: 'Ration Card', description: 'Member Update' },
  ];

  const handleStart = () => {
    onStartCall(selectedService);
  };

  return (
    <div
      className={cn(
        'bg-background flex min-h-[85vh] items-center justify-center px-6 py-12 font-sans',
        className
      )}
    >
      <section className="text-foreground mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-24 lg:grid-cols-2">
        {/* Left Side: Branding */}
        <div className="flex h-full flex-col items-start justify-between py-8 text-left">
          <div className="space-y-10">
            <WelcomeIcon />
            <div>
              <h1 className="text-foreground mb-8 font-serif text-6xl leading-[0.95] font-normal tracking-[-0.03em] md:text-8xl">
                Vak <span className="text-primary/60">Sahayak</span>
              </h1>
              <p className="text-muted-foreground max-w-md text-xl leading-relaxed font-light md:text-2xl">
                {appConfig.pageDescription}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-16">
            <div className="flex flex-col gap-6">
              <span className="text-foreground text-xl font-medium tracking-widest uppercase">
                Powered by
              </span>
              <div className="flex items-center gap-6">
                <img
                  src="https://media.brand.dev/8eaa65e9-6bb4-49e2-9cef-d45fcfbe6f39.svg"
                  alt="Sarvam Icon"
                  className="h-10 w-10"
                />
                <div className="bg-foreground h-8 w-px" />
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
        <div className="bg-card border-primary flex flex-col gap-10 rounded-[3rem] border p-10 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-foreground text-xs font-medium tracking-[0.2em] uppercase">
                Select Service
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={cn(
                    'group flex items-center justify-between rounded-[1.5rem] border p-6 text-left transition-all duration-300',
                    selectedService === service.id
                      ? 'bg-primary text-primary-foreground border-primary scale-[1.02]'
                      : 'bg-card border-primary hover:border-primary hover:bg-muted'
                  )}
                >
                  <div>
                    <h3
                      className={cn(
                        'text-lg font-medium transition-colors',
                        selectedService === service.id
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      )}
                    >
                      {service.name}
                    </h3>
                    <p
                      className={cn(
                        'mt-1 text-xs transition-colors',
                        selectedService === service.id
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      )}
                    >
                      {service.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all duration-500',
                      selectedService === service.id ? 'bg-primary-foreground' : 'bg-muted'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="bg-primary text-primary-foreground hover:bg-primary/95 h-16 w-full rounded-[1.5rem] border-none text-xl font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {startButtonText}
          </Button>
        </div>
      </section>
    </div>
  );
};
