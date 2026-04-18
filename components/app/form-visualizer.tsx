import { useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
// eslint-disable-next-line import/named
import { AnimatePresence, motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { Button } from '@/components/ui/button';
import { DEFAULT_SERVICE, FORM_SCHEMAS } from '@/lib/form-schemas';
import { cn } from '@/lib/shadcn/utils';

export interface FormData {
  [key: string]: string;
}

interface FormVisualizerProps {
  data: FormData;
  activeField?: string | null;
  isSubmitted: boolean;
  appConfig: AppConfig;
  serviceType: string;
  onReset: () => void;
}

export function FormVisualizer({
  data,
  activeField,
  isSubmitted,
  serviceType = DEFAULT_SERVICE,
  onReset,
}: FormVisualizerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const prevDataKeys = useRef<string[]>([]);
  const currentSchema = FORM_SCHEMAS[serviceType] || FORM_SCHEMAS[DEFAULT_SERVICE];
  const fields = currentSchema.fields.map((field) => ({
    ...field,
    value: data[field.id],
  }));

  const firstEmptyFieldId = fields.find((f) => !f.value)?.id;
  const targetFocusId = activeField || firstEmptyFieldId;

  // Auto-scroll the active field or most recently updated field into view
  useEffect(() => {
    const currentKeys = Object.keys(data);
    const changedKey = currentKeys.find(
      (key) => data[key] !== undefined && !prevDataKeys.current.includes(key)
    );

    // Prioritize the deterministically empty field or explicitly focused field.
    const targetId = targetFocusId || changedKey || currentKeys[currentKeys.length - 1];

    if (scrollRef.current && targetId) {
      const element = scrollRef.current.querySelector(`[data-field-id="${targetId}"]`);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // Fallback to bottom if element not found but data is present and no active field
        if (currentKeys.length > 0 && !targetFocusId) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      }
    }
    prevDataKeys.current = currentKeys;
  }, [data, activeField, targetFocusId]);

  const progress = Object.values(data).filter(Boolean).length;
  const total = fields.length;
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className="bg-card border-primary relative mx-auto flex h-[600px] w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border p-8 font-sans shadow-sm">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="form-fields"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="mb-8 flex shrink-0 items-center justify-between">
              <div>
                <h2 className="text-foreground flex items-center gap-2 text-xl font-semibold tracking-tight">
                  Tracker
                </h2>
                <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                  Current Session
                </p>
              </div>
              <div className="text-right">
                <div className="text-foreground text-2xl font-semibold tracking-tighter tabular-nums">
                  {percentage}%
                </div>
              </div>
            </div>

            <div className="bg-muted mb-8 h-1.5 w-full shrink-0 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                className="bg-primary h-full"
              />
            </div>

            {/* Scrollable Fields Area */}
            <div ref={scrollRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    data-field-id={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, ease: 'easeOut' }}
                    className={cn(
                      'flex shrink-0 items-center gap-4 rounded-2xl border p-4 transition-all duration-500',
                      field.value ? 'bg-muted border-primary' : 'border-transparent bg-transparent',
                      targetFocusId === field.id && !field.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : ''
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500',
                        field.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <field.icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground mb-0.5 text-xs font-medium tracking-[0.15em] uppercase">
                        {field.label}
                      </div>
                      <div
                        className={cn(
                          'truncate text-sm font-medium transition-colors duration-500',
                          field.value ? 'text-foreground' : 'text-muted-foreground italic'
                        )}
                      >
                        {field.value || 'Waiting for input...'}
                      </div>
                    </div>
                    {field.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        <CheckCircle2 size={16} className="text-primary" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center py-4 text-center"
          >
            <div className="bg-primary mb-6 rounded-full p-4">
              <CheckCircle2 size={40} className="text-white" />
            </div>

            <h2 className="text-foreground mb-2 text-2xl font-bold">Application Submitted!</h2>
            <p className="text-muted-foreground mb-8 max-w-xs text-sm leading-relaxed">
              Your {currentSchema.title} has been successfully processed and forwarded.
            </p>

            <div className="mb-8 w-full space-y-4">
              <div className="bg-muted/50 border-primary/20 flex items-center justify-between rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={18} />
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Reference
                  </span>
                </div>
                <span className="font-mono text-sm font-bold">VS-7729-AK</span>
              </div>

              <Button className="bg-primary hover:bg-primary/90 h-12 w-full rounded-xl text-base font-semibold text-white shadow-sm">
                Track Status
              </Button>
            </div>

            {onReset && (
              <button
                onClick={onReset}
                className="text-foreground hover:text-primary flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors"
              >
                <ArrowLeft size={16} />
                Start New
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
