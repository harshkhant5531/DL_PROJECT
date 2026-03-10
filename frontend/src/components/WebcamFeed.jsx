import React, { useRef, useCallback, useEffect, useState } from 'react';
import Webcam from "react-webcam";

const WebcamFeed = ({ onGazeDataUpdate }) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const warningCountRef = useRef(0);

  const capture = useCallback(async () => {
    if (webcamRef.current && !isProcessing) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsProcessing(true);
        try {
          const res = await fetch('http://localhost:8000/api/process_frame', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                image: imageSrc, 
                warning_count: warningCountRef.current 
            })
          });
          const data = await res.json();
          warningCountRef.current = data.warning_count;
          onGazeDataUpdate(data);
        } catch (error) {
          console.error("Error processing frame:", error);
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
    </div>
  );
};

export default WebcamFeed;
