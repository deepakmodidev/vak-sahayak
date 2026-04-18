'use client';

import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { DEFAULT_SERVICE, FORM_SCHEMAS } from '@/lib/form-schemas';

interface SuccessViewProps {
  serviceType?: string;
  onReset?: () => void;
}

export function SuccessView({ serviceType = DEFAULT_SERVICE, onReset }: SuccessViewProps) {
  const currentSchema = FORM_SCHEMAS[serviceType] || FORM_SCHEMAS[DEFAULT_SERVICE];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border-primary relative mx-auto flex h-full min-h-[400px] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border p-8 text-center shadow-sm"
    >
      <div className="mb-6 flex justify-center">
        <div className="bg-primary rounded-full p-3">
          <CheckCircle2 size={48} className="text-white" />
        </div>
      </div>

      <h2 className="text-foreground mb-2 text-3xl font-bold">Application Submitted!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Your {currentSchema.title} has been successfully processed and forwarded to the respective
        department.
      </p>

      <div className="mb-8 w-full max-w-sm space-y-3">
        <div className="bg-muted/50 border-border flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={20} />
            <span className="text-sm font-medium">Reference Number</span>
          </div>
          <span className="font-mono text-sm font-bold tracking-wider">VS-7729-AK</span>
        </div>
        <p className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
          Confirmation sent to your registered mobile number
        </p>
      </div>

      <div className="mb-8 w-full max-w-sm">
        <Button className="bg-primary hover:bg-primary/90 h-12 w-full rounded-xl text-base font-semibold text-white">
          Track Status
        </Button>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="text-muted-foreground hover:text-primary mx-auto flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Start New Application
        </button>
      )}
    </motion.div>
  );
}
