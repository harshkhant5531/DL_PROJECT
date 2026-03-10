import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

const severityStyle = {
  low: {
    wrapper: "bg-yellow-50 border-yellow-500 text-yellow-800",
    icon: AlertTriangle,
    iconClass: "text-yellow-700",
  },
  medium: {
    wrapper: "bg-orange-50 border-orange-500 text-orange-800",
    icon: AlertTriangle,
    iconClass: "text-orange-700",
  },
  high: {
    wrapper: "bg-red-100 border-red-500 text-red-700",
    icon: AlertCircle,
    iconClass: "text-red-700 animate-pulse",
  },
};

const WarningAlert = ({ warning, message, severity = "high" }) => {
  const style = severityStyle[severity] || severityStyle.high;
  const AlertIcon = style.icon;

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {warning ? (
          <motion.div
            key={`warning-${severity}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`flex items-center gap-3 p-4 border-l-4 rounded-lg shadow-sm ${style.wrapper}`}
          >
            <AlertIcon size={24} className={style.iconClass} />
            <span className="font-semibold text-lg">{message}</span>
          </motion.div>
        ) : (
          <motion.div
            key="safe"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-3 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg shadow-sm"
          >
            <CheckCircle size={24} />
            <span className="font-semibold text-lg">All good! Keep your eyes on the screen.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarningAlert;
