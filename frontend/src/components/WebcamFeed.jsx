import React, { useRef, useCallback, useEffect, useState } from 'react';
import Webcam from "react-webcam";

const configuredBackendBase = (import.meta.env.VITE_BACKEND_URL || "").trim();
const API_ENDPOINT = configuredBackendBase
  ? `${configuredBackendBase.replace(/\/$/, "")}/api/process_frame`
  : "/api/process_frame";

const WebcamFeed = ({ onGazeDataUpdate }) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eyeTarget, setEyeTarget] = useState({ x: 0.5, y: 0.5 });
  const [eyeBoxes, setEyeBoxes] = useState({ left: null, right: null });
  const consecutiveAwayRef = useRef(0);

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
            className="absolute border border-green-400/60 bg-green-400/5 transition-all duration-150"
            style={{
              left: `${eyeBoxes.left[0] * 100}%`,
              top: `${eyeBoxes.left[1] * 100}%`,
              width: `${eyeBoxes.left[2] * 100}%`,
              height: `${eyeBoxes.left[3] * 100}%`,
            }}
          />
        )}
        {eyeBoxes.right && (
          <div
            className="absolute border border-green-400/60 bg-green-400/5 transition-all duration-150"
            style={{
              left: `${eyeBoxes.right[0] * 100}%`,
              top: `${eyeBoxes.right[1] * 100}%`,
              width: `${eyeBoxes.right[2] * 100}%`,
              height: `${eyeBoxes.right[3] * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WebcamFeed;
