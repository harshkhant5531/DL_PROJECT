import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const AttentionScoreMeter = ({ score }) => {
  // Determine color and icon based on score
  let colorClass = "text-emerald-500 from-emerald-400 to-teal-600";
  let Icon = ShieldCheck;
  let statusLabel = "Secure";
  
  if (score < 50) {
    colorClass = "text-rose-500 from-rose-400 to-red-600";
    Icon = ShieldAlert;
    statusLabel = "Critical";
  } else if (score < 80) {
    colorClass = "text-amber-500 from-amber-400 to-orange-600";
    Icon = Shield;
    statusLabel = "Warning";
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <Activity size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Integrity Index</h2>
      </div>

      <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
        {/* Decorative Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-slate-100 shadow-xl shadow-slate-200/50" />
        
        {/* Progress Circle SVG */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="transparent"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeDasharray="276.5" // 2 * pi * 44
            initial={{ strokeDashoffset: 276.5 }}
            animate={{ strokeDashoffset: 276.5 * (1 - score / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`${colorClass.split(' ')[0]} transition-all duration-500`}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-full w-[78%] h-[78%] border border-white/60 shadow-inner">
          <div className={`flex items-center gap-1 mb-1 ${colorClass.split(' ')[0]}`}>
            <Icon size={16} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{statusLabel}</span>
          </div>
          <span className={`text-5xl font-black tracking-tighter ${colorClass.split(' ')[0]}`}>
            {score}
          </span>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Trust Score</span>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4 w-full">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status</span>
          <span className={`text-xs font-black uppercase ${colorClass.split(' ')[0]}`}>{statusLabel}</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Level</span>
          <span className="text-xs font-black uppercase text-slate-800">
            {score > 90 ? "Prime" : score > 60 ? "Valid" : "Risk"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttentionScoreMeter;
