import React from 'react';
import { History, AlertTriangle, Fingerprint, Zap } from 'lucide-react';

const BehaviorTimeline = ({ events }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <History size={18} className="text-amber-400" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Neural Log</h2>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-blue-500/40" />
          <div className="w-1 h-1 rounded-full bg-blue-500/20" />
          <div className="w-1 h-1 rounded-full bg-blue-500/10" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar scroll-smooth">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 grayscale">
            <Fingerprint size={48} className="mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center">No Trace Detected</p>
          </div>
        ) : (
          events.slice().reverse().map((event, index) => (
            <div 
              key={index} 
              className="group relative flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all hover:border-amber-500/20 shadow-lg"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <AlertTriangle size={14} />
                </div>
                {index !== 0 && (
                  <div className="absolute top-10 bottom-0 left-1/2 w-px bg-white/5 -translate-x-1/2 h-full z-0" />
                )}
              </div>

               <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 leading-snug truncate group-hover:text-amber-200 transition-colors">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap size={10} className="text-amber-500/50" />
                    <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-tighter">
                      {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BehaviorTimeline;
