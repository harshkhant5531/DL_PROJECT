import React from "react";
import { XCircle, AlertTriangle, LogOut } from "lucide-react";

const BlockingModal = ({ isOpen, reason, onHome }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300 border border-red-100">
        <div className="bg-red-600 p-8 flex justify-center">
          <div className="bg-white/20 p-4 rounded-full">
            <XCircle className="text-white" size={60} />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Blocked</h2>
          <p className="text-gray-600 mb-6">
            Your session has been terminated for the following reason:
          </p>
          
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
            <p className="text-red-700 font-semibold text-lg flex items-center justify-center gap-2">
              <AlertTriangle size={20} />
              {reason}
            </p>
          </div>
          
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            This activity has been logged and reported. If you believe this is a mistake, please contact your administrator.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 group active:scale-95"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Exit Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockingModal;
