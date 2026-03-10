import React from 'react';
import { ScrollText, AlertTriangle } from 'lucide-react';

const BehaviorTimeline = ({ events }) => {
  return (
    <div className="flex flex-col h-full max-h-64">
      <div className="flex items-center gap-2 mb-4 text-gray-700 pb-2 border-b border-gray-200">
        <ScrollText size={20} className="text-purple-500" />
        <h2 className="text-lg font-semibold">Violation Timeline</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <p className="text-gray-400 text-sm text-center italic mt-10">No violations recorded.</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className="flex gap-3 bg-red-50 p-3 rounded-lg border border-red-100 items-start shadow-sm">
               <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
               <div className="flex-1">
                 <p className="text-sm font-medium text-red-800">{event.message}</p>
                 <p className="text-xs text-red-500 mt-1 font-mono">
                   {event.time.toLocaleTimeString()}
                 </p>
               </div>
            </div>
          )).reverse() // Show newest first
        )}
      </div>
    </div>
  );
};

export default BehaviorTimeline;
