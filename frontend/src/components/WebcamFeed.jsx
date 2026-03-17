import React, { useRef, useCallback, useEffect, useState } from 'react';
import Webcam from "react-webcam";
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Scan, Shield, Activity, Eye, AlertCircle } from 'lucide-react';

const configuredBackendBase = (import.meta.env.VITE_BACKEND_URL || "").trim();
const API_ENDPOINT = configuredBackendBase
  ? `${configuredBackendBase.replace(/\/$/, "")}/api/process_frame`
  : "/api/process_frame";

const WebcamFeed = ({ onGazeDataUpdate }) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const warningCountRef = useRef(0);
  const consecutiveAwayRef = useRef(0);
  const [lastDirection, setLastDirection] = useState("initializing");

  const capture = useCallback(async () => {
    if (webcamRef.current && !isProcessing) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsProcessing(true);
        try {
          const res = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image: imageSrc,
              warning_count: warningCountRef.current,
              consecutive_away: consecutiveAwayRef.current
            })
          });
          if (!res.ok) throw new Error(`Backend returned ${res.status}`);
          const data = await res.json();
          warningCountRef.current = data.warning_count;
          setLastDirection(data.gaze_direction || "unknown");

          if (data.gaze_direction === "center") {
            consecutiveAwayRef.current = 0;
          } else {
            consecutiveAwayRef.current += 1;
          }
          
          onGazeDataUpdate(data);
        } catch (error) {
          console.error("Error processing frame:", error);
          onGazeDataUpdate((prev) => ({
            ...prev,
            warning: true,
            cheating_risk: "high",
            warning_message: "Relay Interrupt: Check Backend Connection",
            error: "backend_unreachable",
          }));
        } finally {
          setIsProcessing(false);
        }
      }
    }
  }, [webcamRef, onGazeDataUpdate, isProcessing]);

  useEffect(() => {
    const interval = setInterval(capture, 1000);
    return () => clearInterval(interval);
  }, [capture]);

  return (
    <div className="relative w-full max-w-2xl mx-auto group overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5 h-fit">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full block opacity-90"
        mirrored={true}
      />

      {/* Clean HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Minimal Scan Line */}
        <motion.div 
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-cyan-500/20 z-20"
        />

        {/* Status Indicators */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
            <Activity size={12} className={isProcessing ? "text-cyan-400 animate-pulse" : "text-white/20"} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Proctor_Active</span>
          </div>
          
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
             <div className={`p-1.5 rounded-lg ${lastDirection === 'center' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {lastDirection === 'center' ? <Eye size={16} /> : <AlertCircle size={16} />}
             </div>
             <div className="flex flex-col">
                <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Target_Focus</span>
                <span className={`text-xs font-black uppercase tracking-widest ${lastDirection === 'center' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lastDirection}
                </span>
             </div>
          </div>
        </div>

        {/* Minimal Corners */}
        <div className="absolute inset-8 border border-white/5 rounded-3xl pointer-events-none" />
      </div>

      {/* Extreme Bottom Bar */}
      <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               animate={{ width: isProcessing ? "100%" : "20%" }}
               className="h-full bg-cyan-500/50" 
             />
          </div>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Stream_Auth_v4</span>
        </div>
      </div>
    </div>
  );
};

export default WebcamFeed;
