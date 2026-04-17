'use client';

import { motion } from 'motion/react';
import { CheckCircle2, ArrowLeft, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FORM_SCHEMAS, DEFAULT_SERVICE } from '@/lib/form-schemas';

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
      className="w-full max-w-xl mx-auto bg-card border border-primary rounded-[2.5rem] p-8 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-center h-full min-h-[400px]"
    >
      <div className="flex justify-center mb-6">
        <div className="bg-primary p-3 rounded-full">
          <CheckCircle2 size={48} className="text-white" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-foreground mb-2">Application Submitted!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Your {currentSchema.title} has been successfully processed and forwarded to the respective department.
      </p>

      <div className="space-y-3 mb-8 w-full max-w-sm">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={20} />
            <span className="text-sm font-medium">Reference Number</span>
          </div>
          <span className="text-sm font-mono font-bold tracking-wider">VS-7729-AK</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Confirmation sent to your registered mobile number
        </p>
      </div>

      <div className="w-full max-w-sm mb-8">
        <Button className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-xl text-base font-semibold">
          Track Status
        </Button>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mx-auto transition-colors"
        >
          <ArrowLeft size={14} />
          Start New Application
        </button>
      )}
    </motion.div>
  );
}
