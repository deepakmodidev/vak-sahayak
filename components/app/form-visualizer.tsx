import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, FileText, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import { Button } from '@/components/ui/button';
import type { AppConfig } from '@/app-config';
import { FORM_SCHEMAS, DEFAULT_SERVICE } from '@/lib/form-schemas';

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

export function FormVisualizer({ data, activeField, isSubmitted, appConfig, serviceType = DEFAULT_SERVICE, onReset }: FormVisualizerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const prevDataKeys = useRef<string[]>([]);
  const currentSchema = FORM_SCHEMAS[serviceType] || FORM_SCHEMAS[DEFAULT_SERVICE];
  const fields = currentSchema.fields.map(field => ({
    ...field,
    value: data[field.id],
  }));

  const firstEmptyFieldId = fields.find(f => !f.value)?.id;
  const targetFocusId = activeField || firstEmptyFieldId;

  // Auto-scroll the active field or most recently updated field into view
  useEffect(() => {
    const currentKeys = Object.keys(data);
    const hasNewData = currentKeys.length > prevDataKeys.current.length;
    const changedKey = currentKeys.find(key => data[key] !== undefined && !prevDataKeys.current.includes(key));
    
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
    <div className="w-full max-w-xl mx-auto bg-card border border-primary rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden font-sans h-[600px] flex flex-col">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="form-fields"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
                  Tracker
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">Current Session</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-foreground tabular-nums tracking-tighter">{percentage}%</div>
              </div>
            </div>

            <div className="w-full h-1.5 bg-muted rounded-full mb-8 overflow-hidden shrink-0">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                className="h-full bg-primary"
              />
            </div>

            {/* Scrollable Fields Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    data-field-id={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, ease: "easeOut" }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border shrink-0",
                      field.value 
                        ? "bg-muted border-primary" 
                        : "bg-transparent border-transparent",
                      targetFocusId === field.id && !field.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : ""
                    )}
                  >
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                        field.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <field.icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-0.5">{field.label}</div>
                      <div className={cn(
                        "font-medium truncate text-sm transition-colors duration-500",
                        field.value ? "text-foreground" : "text-muted-foreground italic"
                      )}>
                        {field.value || 'Waiting for input...'}
                      </div>
                    </div>
                    {field.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
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
            className="flex-1 flex flex-col items-center justify-center text-center py-4"
          >
            <div className="bg-primary p-4 rounded-full mb-6">
              <CheckCircle2 size={40} className="text-white" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
              Your {currentSchema.title} has been successfully processed and forwarded.
            </p>

            <div className="w-full space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</span>
                </div>
                <span className="text-sm font-mono font-bold">VS-7729-AK</span>
              </div>
              
              <Button className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-xl text-base font-semibold shadow-sm">
                Track Status
              </Button>
            </div>

            {onReset && (
              <button
                onClick={onReset}
                className="text-xs text-foreground hover:text-primary flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
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
