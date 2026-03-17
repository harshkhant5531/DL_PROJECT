import React from "react";
import { XCircle, AlertTriangle, LogOut } from "lucide-react";

const BlockingModal = ({ isOpen, reason, onHome }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="bg-rose-600 p-8 flex justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-rose-700 opacity-50" />
          <div className="relative bg-white/10 p-4 rounded-3xl border border-white/20 shadow-inner">
            <XCircle className="text-white" size={60} />
          </div>
        </div>
        
        <div className="p-8 text-center bg-white">
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Exam Blocked</h2>
          <p className="text-slate-500 mb-6 text-sm font-medium">
            Your session has been terminated for the following reason:
          </p>
          
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-8">
            <p className="text-rose-700 font-bold text-lg flex items-center justify-center gap-2">
              <AlertTriangle size={20} />
              {reason}
            </p>
          </div>
          
          <p className="text-[11px] text-slate-400 mb-8 leading-relaxed font-bold uppercase tracking-widest">
            This activity has been logged and reported. If you believe this is a mistake, please contact your administrator.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Resume Protocol
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockingModal;
