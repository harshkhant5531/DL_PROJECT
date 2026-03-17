import React, { useState, useEffect, useRef } from "react";
import { Maximize, Wifi, WifiOff, MonitorDot, Shield, Activity, ListChecks, History } from "lucide-react";
import WebcamFeed from "./components/WebcamFeed";
import GazeIndicator from "./components/GazeIndicator";
import WarningAlert from "./components/WarningAlert";
import ExamTimer from "./components/ExamTimer";
import BehaviorTimeline from "./components/BehaviorTimeline";
import AttentionScoreMeter from "./components/AttentionScoreMeter";
import MCQExam from "./components/MCQExam";
import BlockingModal from "./components/BlockingModal";

const ALERT_DEDUP_MS = 1500;

function App() {
  const [gazeData, setGazeData] = useState({
    gaze_direction: "center",
    cheating_risk: "low",
    warning: false,
    attention_score: 100,
    warning_message: null,
  });

  const [events, setEvents] = useState([]);
  const [examStarted, setExamStarted] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const webcamRef = useRef(null);
  const lastEventRef = useRef({ message: "", at: 0 });
  const lastWarningStateRef = useRef(false);

  const pushEvent = (message, force = false) => {
    if (!examStarted || isBlocked) return;

    const now = Date.now();
    const last = lastEventRef.current;

    // Only deduplicate if it's the same message and not forced
    if (!force && last.message === message && now - last.at < ALERT_DEDUP_MS) {
      return;
    }

    lastEventRef.current = { message, at: now };
    const event = { time: new Date(now), message };
    setEvents((prev) => [...prev, event]);

    // Track if this is a violation/penalty event
    const lowerMsg = message.toLowerCase();
    const isViolation = lowerMsg.includes("suspicious") ||
      lowerMsg.includes("risk") ||
      lowerMsg.includes("switched") ||
      lowerMsg.includes("offline") ||
      lowerMsg.includes("error") ||
      lowerMsg.includes("gaze") ||
      lowerMsg.includes("attention");

    if (isViolation) {
      setViolationCount(prev => prev + 1);
    }
  };

  // Watch for any warning or error in gazeData
  useEffect(() => {
    if (examStarted && !isBlocked) {
      const isCurrentlyUnsafe = !!(gazeData.warning || gazeData.error);

      if (isCurrentlyUnsafe) {
        const msg = gazeData.warning_message || gazeData.error || "Suspicious behavior detected.";

        // If we just transitioned from safe to unsafe, force an instant update
        const justBecameUnsafe = !lastWarningStateRef.current;
        pushEvent(msg, justBecameUnsafe);
      }

      lastWarningStateRef.current = isCurrentlyUnsafe;
    }
  }, [gazeData, examStarted, isBlocked]);

  useEffect(() => {
    if (examStarted && gazeData.attention_score === 0) {
      pushEvent("Attention dropped to 0 - exam blocked.");
      setBlockReason("Your integrity score dropped to zero.");
      setExamStarted(false);
      setIsBlocked(true);
    }
  }, [examStarted, gazeData.attention_score]);

  useEffect(() => {
    if (examStarted && violationCount >= 10) {
      setBlockReason("Maximum violation limit (10) exceeded.");
      setExamStarted(false);
      setIsBlocked(true);
    }
  }, [violationCount, examStarted]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      pushEvent("Internet connection lost.");
    };

    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        setIsTabFocused(false);

        // Decrease score for violation
        if (webcamRef.current) {
          webcamRef.current.addPenalty(15);
        }

        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          pushEvent(`User switched away from exam tab (${nextCount}/2).`);

          if (nextCount >= 2) {
            setBlockReason("Maximum tab switch limit (2) exceeded.");
            setIsBlocked(true);
            setExamStarted(false);
          }
          return nextCount;
        });
      } else {
        setIsTabFocused(true);
      }
    };

    const handleFullscreenChange = () => {
      const full = !!document.fullscreenElement;
      setIsFullscreen(full);
      if (examStarted && !full) {
        pushEvent("Fullscreen mode exited during exam.");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examStarted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const deriveActiveAlert = () => {
    if (!examStarted) {
      return {
        warning: false,
        severity: "low",
        message: "Monitoring Standby",
      };
    }

    if (!isOnline) {
      return {
        warning: true,
        severity: "high",
        message: "Connectivity Failure",
      };
    }

    if (!isTabFocused) {
      return {
        warning: true,
        severity: "high",
        message: "Tab Switch Detected",
      };
    }

    if (!isFullscreen) {
      return {
        warning: true,
        severity: "medium",
        message: "Fullscreen Required",
      };
    }

    if (gazeData.error) {
      return {
        warning: true,
        severity: "high",
        message: gazeData.warning_message || "Input Error",
      };
    }

    if (gazeData.warning) {
      return {
        warning: true,
        severity: gazeData.cheating_risk === "high" ? "high" : "medium",
        message: gazeData.warning_message || "Suspicious Movement",
      };
    }

    return {
      warning: false,
      severity: "low",
      message: "Secure Session Active",
    };
  };

  const activeAlert = deriveActiveAlert();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col font-sans selection:bg-blue-500/20">
      {/* HUD Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-500/20 shadow-sm">
            <MonitorDot className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Sentinel AI
            </h1>
            <span className="text-[10px] text-blue-600 font-bold tracking-[0.3em] uppercase opacity-70">Proctoring Interface</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all 
            ${isOnline ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {isOnline ? "Relay Online" : "Relay Offline"}
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          <button
            onClick={toggleFullscreen}
            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="Toggle Secure View"
          >
            <Maximize size={18} />
          </button>

          <ExamTimer isActive={examStarted} />
        </div>
      </header>

      {/* Extreme Warning Banner */}
      {!isTabFocused && examStarted && (
        <div className="bg-rose-600 text-white text-center py-2 font-black tracking-[0.5em] text-[10px] shadow-2xl animate-[pulse_1s_infinite] border-b border-rose-500">
          SYSTEM BREACH: TAB FOCUS LOST
        </div>
      )}

      {/* Main Grid */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Main Observation Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                  <Shield className="text-blue-500" size={16} />
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Video Telemetry</h2>
              </div>

              {examStarted && (
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Neural Link: Good</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative rounded-3xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center border border-slate-200 shadow-inner group/vid">
              {!examStarted ? (
                <div className="text-slate-900 text-center p-8">
                  <MonitorDot
                    size={48}
                    className="mx-auto text-blue-500 mb-4 opacity-70"
                  />
                  <p className="mb-6 text-slate-500">
                    Camera permission and AI initialization required.
                  </p>

                  <button
                    onClick={() => {
                      setExamStarted(true);
                      toggleFullscreen();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95"
                  >
                    Begin Exam Securely
                  </button>
                </div>
              ) : (
                <WebcamFeed ref={webcamRef} onGazeDataUpdate={setGazeData} />
              )}

              {/* Camera Scanning Overlay Effect */}
              {examStarted && (
                <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-400/5 flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-slate-400/30" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-slate-400/30" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-slate-400/30" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-slate-400/30" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <WarningAlert
                warning={activeAlert.warning}
                severity={activeAlert.severity}
                message={activeAlert.message}
              />
            </div>

            {examStarted && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <ListChecks className="text-emerald-600" size={16} />
                  </div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Questionnaire Module</h2>
                </div>
                <MCQExam
                  onFinish={({ score: finalScore, total }) => {
                    setEvents((prev) => [
                      ...prev,
                      {
                        time: new Date(),
                        message: `MCQ Terminal Completed. Final Score: ${finalScore}/${total}`,
                      },
                    ]);
                    // Reset monitoring state when session ends
                    setViolationCount(0);
                    setTabSwitchCount(0);
                    if (webcamRef.current) {
                      webcamRef.current.resetAttention();
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Analytics Sider */}
        <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
          {/* Gaze HUD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={12} />
              Spatial Vectors
            </h2>
            <GazeIndicator direction={gazeData.gaze_direction} />
          </div>

          {/* Integrity Meter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={12} />
              System Integrity
            </h2>
            <AttentionScoreMeter score={gazeData.attention_score} />
          </div>

          <div className="bg-white p-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 flex-1 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-red-500"></div>
            <BehaviorTimeline events={events} />
            <div className="absolute bottom-4 left-6 right-6 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        </div>
      </main>

      {/* Security Enforcement Modal */}
      <BlockingModal 
        isOpen={isBlocked} 
        reason={blockReason} 
      />
    </div>
  );
}

export default App;
