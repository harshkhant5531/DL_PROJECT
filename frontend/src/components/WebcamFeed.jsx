import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, CameraOff, Wifi, WifiOff } from "lucide-react";
import Webcam from "react-webcam";

const configuredBackendBase = (import.meta.env.VITE_BACKEND_URL || "").trim();
const API_ENDPOINT = configuredBackendBase
  ? `${configuredBackendBase.replace(/\/$/, "")}/api/process_frame`
  : "/api/process_frame";

const defaultTelemetry = {
  leftBox: null,
  rightBox: null,
  direction: "center",
};

const formatDirection = (value, fallback = "calibrating") =>
  (value || fallback)
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

function WebcamFeed({ enabled = true, onGazeDataUpdate }) {
  const webcamRef = useRef(null);
  const warningCountRef = useRef(0);
  const consecutiveAwayRef = useRef(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [telemetry, setTelemetry] = useState(defaultTelemetry);

  const capture = useCallback(async () => {
    if (!enabled || !webcamRef.current || isProcessing) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          warning_count: warningCountRef.current,
          consecutive_away: consecutiveAwayRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();

      setIsConnected(true);
      setTelemetry({
        leftBox: data.left_eye_box ?? null,
        rightBox: data.right_eye_box ?? null,
        direction: data.gaze_direction ?? "center",
      });

      warningCountRef.current = data.warning_count ?? warningCountRef.current;
      const directionKey = (data.gaze_direction || "").toString().toLowerCase();
      consecutiveAwayRef.current =
        directionKey === "center" ? 0 : consecutiveAwayRef.current + 1;

      if (onGazeDataUpdate) {
        onGazeDataUpdate(data);
      }
    } catch {
      setIsConnected(false);
      setTelemetry(defaultTelemetry);

      if (onGazeDataUpdate) {
        onGazeDataUpdate({
          gaze_direction: "unknown",
          cheating_risk: "high",
          warning: true,
          attention_score: 0,
          warning_count: warningCountRef.current,
          warning_message: "Unable to reach backend API.",
          error: "connection_error",
          gaze_vector: [0, 0, 0],
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [enabled, isProcessing, onGazeDataUpdate]);

  useEffect(() => {
    if (!enabled) {
      warningCountRef.current = 0;
      consecutiveAwayRef.current = 0;
      return undefined;
    }

    const intervalId = setInterval(capture, 1000);
    return () => clearInterval(intervalId);
  }, [capture, enabled]);

  const renderEyeBox = (box, className) => {
    if (!box) {
      return null;
    }

    return (
      <div
        className={`absolute rounded-sm border-2 ${className}`}
        style={{
          left: `${box[0] * 100}%`,
          top: `${box[1] * 100}%`,
          width: `${box[2] * 100}%`,
          height: `${box[3] * 100}%`,
        }}
      />
    );
  };

  const directionLabel = enabled ? formatDirection(telemetry.direction) : "Idle";
  const processingLabel = !enabled
    ? "Stream Paused"
    : isProcessing
      ? "Processing Frame"
      : "Awaiting Frame";

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl shadow-slate-950/70">
      {enabled ? (
        <Webcam
          audio={false}
          mirrored
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="h-full w-full object-cover"
          videoConstraints={{ facingMode: "user" }}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 text-slate-400">
          <div className="flex flex-col items-center gap-2 text-center">
            <CameraOff size={26} />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              Stream Paused
            </p>
            <p className="text-xs text-slate-500">Start monitoring to resume camera inference.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/15" />

      <div className="pointer-events-none absolute inset-0">
        {enabled &&
          renderEyeBox(
            telemetry.leftBox,
            "rounded-md border-sky-400/85 bg-sky-500/10 shadow-md shadow-sky-500/30",
          )}
        {enabled &&
          renderEyeBox(
            telemetry.rightBox,
            "rounded-md border-indigo-400/85 bg-indigo-500/10 shadow-md shadow-indigo-500/30",
          )}
      </div>

      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur ${enabled ? "border-sky-500/35 bg-slate-900/85 text-sky-100" : "border-slate-500/50 bg-slate-900/90 text-slate-300"}`}
        >
          <Activity size={11} className={isProcessing && enabled ? "animate-pulse" : ""} />
          {enabled ? "Live Feed" : "Paused"}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur ${isConnected ? "border-emerald-500/40 bg-slate-900/85 text-emerald-100" : "border-red-500/40 bg-slate-900/85 text-red-200"}`}
        >
          {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isConnected ? "Backend Online" : "Backend Offline"}
        </span>
      </div>

      <div className="absolute bottom-3 left-3 rounded-md border border-slate-600/70 bg-slate-900/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] backdrop-blur">
        <p className="font-semibold text-slate-400">Direction</p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-100">{directionLabel}</p>
      </div>

      <div className="absolute bottom-3 right-3 rounded-md border border-slate-600/70 bg-slate-900/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-100 backdrop-blur">
        <span className="inline-flex items-center gap-2">
          <Activity size={12} className={enabled && isProcessing ? "animate-spin" : ""} />
          {processingLabel}
        </span>
      </div>
    </div>
  );
}

export default WebcamFeed;
