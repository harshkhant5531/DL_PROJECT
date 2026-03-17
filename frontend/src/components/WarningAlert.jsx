import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

const severityStyle = {
  low: {
    wrapper: "bg-blue-50/50 border-blue-100 text-blue-900",
    icon: ShieldCheck,
    iconClass: "text-blue-600",
    glow: "shadow-blue-500/5",
  },
  medium: {
    wrapper: "bg-amber-50 border-amber-200 text-amber-900",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    glow: "shadow-amber-500/10",
  },
  high: {
    wrapper: "bg-rose-50 border-rose-200 text-rose-900",
    icon: AlertCircle,
    iconClass: "text-rose-600 animate-pulse",
    glow: "shadow-rose-500/20",
  },
};

const WarningAlert = ({ warning, message, severity = "high" }) => {
  const style = severityStyle[severity] || severityStyle.high;
  const AlertIcon = style.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        {warning ? (
          <motion.div
            key={`warning-${severity}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className={`flex items-center gap-4 p-5 border backdrop-blur-md shadow-2xl transition-all ${style.wrapper} ${style.glow}`}
          >
            <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${style.iconClass}`}>
              <AlertIcon size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Warning Delta</span>
              <span className="font-bold text-sm tracking-tight">{message}</span>
            </div>
            <div className="ml-auto">
              <Zap size={14} className="opacity-20 translate-x-1" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="safe"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 text-emerald-900 backdrop-blur-md shadow-lg shadow-emerald-500/5"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 text-emerald-700">Status Protocol</span>
              <span className="font-bold text-sm tracking-tight">System Secure — Eyes on Target</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarningAlert;
