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
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-gray-700 font-semibold border border-gray-200 shadow-sm bg-gray-50/50">
      <Timer size={18} className="text-blue-500" />
      <span className="text-lg tabular-nums tracking-widest">{formatTime(seconds)}</span>
    </div>
  );
};

export default ExamTimer;
