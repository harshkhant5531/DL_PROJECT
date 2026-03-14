import React, { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Webcam from "react-webcam";

const configuredBackendBase = (import.meta.env.VITE_BACKEND_URL || "").trim();
const API_ENDPOINT = configuredBackendBase
  ? `${configuredBackendBase.replace(/\/$/, "")}/api/process_frame`
  : "/api/process_frame";

const WebcamFeed = forwardRef(({ onGazeDataUpdate }, ref) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const warningCountRef = useRef(0);
  const [eyeTarget, setEyeTarget] = useState({ x: 0.5, y: 0.5 });
  const [eyeBoxes, setEyeBoxes] = useState({ left: null, right: null });
  const [eyeIrises, setEyeIrises] = useState({ left: null, right: null });
  const consecutiveAwayRef = useRef(0);
  
  useImperativeHandle(ref, () => ({
    addPenalty: (amount = 5) => {
      warningCountRef.current = Math.min(100, warningCountRef.current + amount);
    }
  }));

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
          if (!res.ok) {
            throw new Error(`Backend returned ${res.status}`);
          }
          const data = await res.json();
          warningCountRef.current = data.warning_count;

          if (data.gaze_direction === "center") {
            consecutiveAwayRef.current = 0;
          } else {
            consecutiveAwayRef.current += 1;
          }
          if (typeof data.eye_target_x === "number" && typeof data.eye_target_y === "number") {
            setEyeTarget({
              x: Math.max(0, Math.min(1, data.eye_target_x)),
              y: Math.max(0, Math.min(1, data.eye_target_y)),
            });
          }
          setEyeBoxes({
            left: data.left_eye_box,
            right: data.right_eye_box
          });
          setEyeIrises({
            left: data.left_iris,
            right: data.right_iris
          });
          onGazeDataUpdate(data);
        } catch (error) {
          console.error("Error processing frame:", error);
          onGazeDataUpdate((prev) => ({
            ...prev,
            warning: true,
            cheating_risk: "high",
            warning_message: "Unable to reach proctoring backend. Monitoring degraded.",
            error: "backend_unreachable",
          }));
        } finally {
          setIsProcessing(false);
        }
      }
    }
  }, [webcamRef, onGazeDataUpdate, isProcessing]);

  useEffect(() => {
    const interval = setInterval(() => {
      capture();
    }, 1000); // 1 FPS for easier load
    return () => clearInterval(interval);
  }, [capture]);

  return (
    <div className="relative w-full h-full">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover"
        mirrored={true}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-16 h-16 md:w-20 md:h-20 border-2 border-cyan-300/95 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] transition-all duration-150"
          style={{
            left: `${eyeTarget.x * 100}%`,
            top: `${eyeTarget.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        {eyeBoxes.left && (
          <div
            className="absolute border-2 border-green-400/80 transition-all duration-150 overflow-hidden"
            style={{
              left: `${eyeBoxes.left[0] * 100}%`,
              top: `${eyeBoxes.left[1] * 100}%`,
              width: `${eyeBoxes.left[2] * 100}%`,
              height: `${eyeBoxes.left[3] * 100}%`,
              borderRadius: '2px',
              boxShadow: '0 0 10px rgba(74, 222, 128, 0.2)',
            }}
          >
            <div className="absolute -top-5 left-0 text-[10px] font-bold text-green-400 bg-black/40 px-1 rounded">EYE L</div>
            {/* Scanning Line */}
            <div className="absolute w-full h-0.5 bg-green-400/50 shadow-[0_0_5px_#4ade80] top-0 animate-scan" />
            {/* Corner pieces */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-400" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-400" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-400" />
          </div>
        )}
        {eyeBoxes.right && (
          <div
            className="absolute border-2 border-green-400/80 transition-all duration-150 overflow-hidden"
            style={{
              left: `${eyeBoxes.right[0] * 100}%`,
              top: `${eyeBoxes.right[1] * 100}%`,
              width: `${eyeBoxes.right[2] * 100}%`,
              height: `${eyeBoxes.right[3] * 100}%`,
              borderRadius: '2px',
              boxShadow: '0 0 10px rgba(74, 222, 128, 0.2)',
            }}
          >
            <div className="absolute -top-5 left-0 text-[10px] font-bold text-green-400 bg-black/40 px-1 rounded">EYE R</div>
            {/* Scanning Line */}
            <div className="absolute w-full h-0.5 bg-green-400/50 shadow-[0_0_5px_#4ade80] top-0 animate-scan" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-400" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-400" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-400" />
          </div>
        )}
        {/* Iris Dots */}
        {eyeIrises.left && (
          <div
            className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-75"
            style={{
              left: `${eyeIrises.left[0] * 100}%`,
              top: `${eyeIrises.left[1] * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
        {eyeIrises.right && (
          <div
            className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-75"
            style={{
              left: `${eyeIrises.right[0] * 100}%`,
              top: `${eyeIrises.right[1] * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </div>
    </div>
  );
});

export default WebcamFeed;
