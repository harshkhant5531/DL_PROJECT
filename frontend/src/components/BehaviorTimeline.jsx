import React from 'react';
import { History, AlertTriangle, Fingerprint, Zap } from 'lucide-react';

const BehaviorTimeline = ({ events }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History size={18} className="text-amber-600" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Neural Log</h2>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-blue-500/20" />
          <div className="w-1 h-1 rounded-full bg-blue-500/10" />
          <div className="w-1 h-1 rounded-full bg-blue-500/5" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar scroll-smooth">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-40 grayscale">
            <Fingerprint size={48} className="mb-4 text-slate-300" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center text-slate-400">No Trace Detected</p>
          </div>
        ) : (
          events.slice().reverse().map((event, index) => (
            <div 
              key={index} 
              className="group relative flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all hover:border-amber-500/30 shadow-sm"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <AlertTriangle size={14} />
                </div>
                {index !== 0 && (
                  <div className="absolute top-10 bottom-0 left-1/2 w-px bg-slate-100 -translate-x-1/2 h-full z-0" />
                )}
              </div>

               <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 leading-snug truncate group-hover:text-amber-900 transition-colors">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap size={10} className="text-amber-500/50" />
                    <span className="text-[10px] font-black text-amber-600/70 uppercase tracking-tighter">
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
