import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AttentionScoreMeter = ({ score }) => {
  // Determine color based on score
  let colorClass = "text-green-500";
  if (score < 50) colorClass = "text-red-500";
  else if (score < 80) colorClass = "text-orange-500";

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-700">Attention Score</h2>
      </div>

      <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray="282.7" // 2 * pi * r
            initial={{ strokeDashoffset: 282.7 }}
            animate={{ strokeDashoffset: 282.7 * (1 - score / 100) }}
            className={`${colorClass} transition-all duration-500 ease-in-out`}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-extrabold ${colorClass}`}>
            {score}
          </span>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">Live Focus Metric</p>
    </div>
  );
};

export default AttentionScoreMeter;
