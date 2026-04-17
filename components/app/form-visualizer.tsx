'use client';

import { motion, AnimatePresence } from 'motion/react';
import { User, MapPin, Calendar, CreditCard, CheckCircle2, ClipboardIcon } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import type { AppConfig } from '@/app-config';

export interface FormData {
  full_name?: string;
  age?: string;
  address?: string;
  id_number?: string;
  service_type?: string;
}

interface FormVisualizerProps {
  data: FormData;
  isSubmitted?: boolean;
  appConfig: AppConfig;
}

export function FormVisualizer({ data, isSubmitted, appConfig }: FormVisualizerProps) {
  const fields = [
    { id: 'service_type', label: 'Service', value: data.service_type, icon: ClipboardIcon },
    { id: 'full_name', label: 'Full Name', value: data.full_name, icon: User },
    { id: 'age', label: 'Age', value: data.age, icon: Calendar },
    { id: 'address', label: 'Address', value: data.address, icon: MapPin },
    { id: 'id_number', label: 'ID Number', value: data.id_number, icon: CreditCard },
  ];

  const progress = Object.values(data).filter(Boolean).length;
  const total = fields.length;
  const percentage = Math.round((progress / total) * 100);

  const primaryColor = appConfig.accent || 'var(--primary)';

  return (
    <div className="w-full max-w-sm mx-auto bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div 
        className="absolute -top-12 -right-12 w-48 h-48 blur-[100px] opacity-10" 
        style={{ backgroundColor: primaryColor }}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            Application Tracker
          </h2>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Vak Sahayak</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white tabular-nums">{percentage}%</div>
        </div>
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1 }}
          style={{ backgroundColor: primaryColor }}
          className="h-full rounded-full"
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 border",
                field.value 
                  ? "bg-white/[0.08] border-white/20 shadow-sm" 
                  : "bg-white/5 border-white/10"
              )}
            >
              <div 
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                  field.value ? "bg-white/10 text-white" : "bg-white/5 text-white/40"
                )}
                style={field.value ? { color: primaryColor } : {}}
              >
                <field.icon size={16} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-white/30 font-bold">{field.label}</div>
                <div className={cn(
                  "font-medium truncate text-sm",
                  field.value ? "text-white" : "text-white/20 italic"
                )}>
                  {field.value || 'Searching...'}
                </div>
              </div>
              {field.value && (
                <CheckCircle2 size={14} className="text-green-500/50" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl text-center"
          >
            <div className="text-green-400 font-bold text-sm">Form Submitted</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
