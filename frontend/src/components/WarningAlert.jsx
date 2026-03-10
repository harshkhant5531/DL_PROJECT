import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

const WarningAlert = ({ warning, message }) => {
  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {warning ? (
          <motion.div
            key="warning"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-3 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm"
          >
            <AlertCircle size={24} className="animate-pulse" />
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
