import React from 'react';
import { ArrowLeft, ArrowRight, Focus, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const GazeIndicator = ({ direction }) => {
  let Icon = Focus;
  let colorClass = "text-green-500 bg-green-100";
  let label = "Center focused";
  let rotation = 0;

  if (direction === "left") {
    Icon = ArrowLeft;
    colorClass = "text-orange-500 bg-orange-100";
    label = "Gazing Left";
  } else if (direction === "right") {
    Icon = ArrowRight;
    colorClass = "text-orange-500 bg-orange-100";
    label = "Gazing Right";
  } else if (direction === "up") {
    Icon = ArrowUp;
    colorClass = "text-orange-500 bg-orange-100";
    label = "Gazing Up";
  } else if (direction === "down") {
    Icon = ArrowDown;
    colorClass = "text-orange-500 bg-orange-100";
    label = "Gazing Down";
  } else if (direction === "unknown") {
    Icon = Focus;
    colorClass = "text-gray-400 bg-gray-100";
    label = "Tracking Lost";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{ 
            scale: [1, 1.1, 1],
            rotate: rotation
        }}
        transition={{ 
            scale: { repeat: Infinity, duration: 2 },
            rotate: { duration: 0.3 }
        }}
        className={`p-6 rounded-full shadow-lg ${colorClass}`}
      >
        <Icon size={48} className="drop-shadow-sm" />
      </motion.div>
      <p className="mt-6 text-xl font-bold text-gray-700">{label}</p>
    </div>
  );
};

export default GazeIndicator;
