import React from 'react';
import { Eye, Focus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GazeIndicator = ({ direction }) => {
  const isCenter = direction === "center";
  const isUnknown = direction === "unknown";

  const getPos = () => {
    switch(direction) {
      case 'left': return { x: -40, y: 0, rotate: -90 };
      case 'right': return { x: 40, y: 0, rotate: 90 };
      case 'up': return { x: 0, y: -40, rotate: 0 };
      case 'down': return { x: 0, y: 40, rotate: 180 };
      default: return { x: 0, y: 0, rotate: 0 };
    }
  };

  const pos = getPos();

  return (
    <div className="flex flex-col items-center justify-center p-6 relative h-48">
      {/* HUD Outer Ring */}
      <div className="absolute inset-0 border-2 border-dashed border-blue-200/30 rounded-full animate-[spin_10s_linear_infinite]" />
      
      {/* Compass / HUD Elements */}
      <div className="relative w-32 h-32 flex items-center justify-center rounded-full border border-blue-100 bg-blue-50/20 backdrop-blur-sm shadow-inner">
        {/* Directional markers */}
        <div className="absolute top-2 w-1 h-3 bg-blue-400/40 rounded-full" />
        <div className="absolute bottom-2 w-1 h-3 bg-blue-400/40 rounded-full" />
        <div className="absolute left-2 w-3 h-1 bg-blue-400/40 rounded-full" />
        <div className="absolute right-2 w-3 h-1 bg-blue-400/40 rounded-full" />

        <AnimatePresence mode="wait">
          <motion.div
            key={direction}
            initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: pos.x, 
              y: pos.y,
              rotate: pos.rotate
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg border-2 z-10 
              ${isCenter ? "bg-emerald-500 border-emerald-400 text-white" : 
                isUnknown ? "bg-slate-400 border-slate-300 text-white" : 
                "bg-blue-600 border-blue-400 text-white"}`}
          >
            {isCenter ? <Focus size={24} /> : <Eye size={24} />}
          </motion.div>
        </AnimatePresence>

        {/* Center Target Point */}
        <div className={`w-2 h-2 rounded-full ${isCenter ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-blue-300 opacity-50"}`} />
      </div>

      <div className="mt-8 flex flex-col items-center">
        <span className={`text-xs font-bold uppercase tracking-[0.2em] mb-1 
          ${isCenter ? "text-emerald-500" : isUnknown ? "text-slate-400" : "text-blue-600"}`}>
          Gaze Status
        </span>
        <span className="text-xl font-black text-slate-800 tracking-tight capitalize">
          {direction === "center" ? "Locked Center" : direction}
        </span>
      </div>
    </div>
  );
};

export default GazeIndicator;
