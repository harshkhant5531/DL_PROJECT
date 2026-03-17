import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const ExamTimer = ({ isActive }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-slate-700 font-bold border border-slate-200 shadow-sm bg-white">
      <Timer size={16} className="text-blue-600" />
      <span className="text-lg tabular-nums tracking-wider">{formatTime(seconds)}</span>
    </div>
  );
};

export default ExamTimer;
