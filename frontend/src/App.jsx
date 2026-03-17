import React, { useState, useEffect, useRef } from "react";
import { Maximize, Wifi, WifiOff, MonitorDot, Shield, Activity, ListChecks, History } from "lucide-react";
import WebcamFeed from "./components/WebcamFeed";
import GazeIndicator from "./components/GazeIndicator";
import WarningAlert from "./components/WarningAlert";
import ExamTimer from "./components/ExamTimer";
import BehaviorTimeline from "./components/BehaviorTimeline";
import AttentionScoreMeter from "./components/AttentionScoreMeter";
import MCQExam from "./components/MCQExam";

const ALERT_DEDUP_MS = 4000;

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

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const lastEventRef = useRef({ message: "", at: 0 });

  const pushEvent = (message) => {
    if (!examStarted) return;

    const now = Date.now();
    const last = lastEventRef.current;
    if (last.message === message && now - last.at < ALERT_DEDUP_MS) {
      return;
    }

    lastEventRef.current = { message, at: now };
    setEvents((prev) => [...prev, { time: new Date(now), message }]);
  };

  useEffect(() => {
    if (gazeData.warning_message) {
      pushEvent(gazeData.warning_message);
    }
  }, [gazeData.warning_message, examStarted]);

  useEffect(() => {
    if (examStarted && gazeData.attention_score === 0) {
      pushEvent("Attention dropped to 0 - exam paused.");
      setExamStarted(false);
    }
  }, [examStarted, gazeData.attention_score]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      pushEvent("Internet connection lost.");
    };

    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        setIsTabFocused(false);
        pushEvent("User switched away from exam tab.");
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      {/* HUD Navbar */}
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-2xl shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <MonitorDot className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">
              Sentinel AI
            </h1>
            <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase opacity-70">Proctoring Interface</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all 
            ${isOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {isOnline ? "Relay Online" : "Relay Offline"}
          </div>

          <div className="h-8 w-px bg-white/5 mx-2" />

          <button
            onClick={toggleFullscreen}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
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
          <div className="bg-[#1e293b]/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Shield className="text-blue-400" size={16} />
                </div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Video Telemetry</h2>
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

            <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-white/5 ring-1 ring-white/5 shadow-inner group/vid">
              {!examStarted ? (
                <div className="text-center p-12 max-w-md">
                  <div className="w-20 h-20 mx-auto bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mb-8 animate-[bounce_3s_infinite]">
                    <MonitorDot size={40} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight italic">READY TO INITIATE?</h3>
                  <p className="mb-8 text-slate-400 text-sm leading-relaxed font-medium">
                    Secure AI monitoring requires camera access. Neural patterns will be analyzed in real-time.
                  </p>

                  <button
                    onClick={() => {
                      setExamStarted(true);
                      toggleFullscreen();
                    }}
                    className="relative group/btn overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest"
                  >
                    <span className="relative z-10">Initialize Secured Session</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  </button>
                </div>
              ) : (
                <WebcamFeed onGazeDataUpdate={setGazeData} />
              )}
              
              {/* Camera Scanning Overlay Effect */}
              {examStarted && (
                <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-white/20" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-white/20" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-white/20" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-white/20" />
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
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <ListChecks className="text-emerald-400" size={16} />
                  </div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Questionnaire Module</h2>
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
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Analytics Sider */}
        <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
          {/* Gaze HUD */}
          <div className="bg-[#1e293b]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={12} />
              Spatial Vectors
            </h2>
            <GazeIndicator direction={gazeData.gaze_direction} />
          </div>

          {/* Integrity Meter */}
          <div className="bg-[#1e293b]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={12} />
              System Integrity
            </h2>
            <AttentionScoreMeter score={gazeData.attention_score} />
          </div>

          {/* Activity Log */}
          <div className="bg-[#1e293b]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl flex-1 relative overflow-hidden flex flex-col min-h-[300px]">
            <h2 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={12} />
              Neural Trace
            </h2>
            <BehaviorTimeline events={events} />
            <div className="absolute bottom-4 left-6 right-6 h-24 bg-gradient-to-t from-[#1e293b] to-transparent pointer-events-none" />
          </div>
        </div>
      </main>
      
      {/* Footer System Info */}
      <footer className="px-8 py-3 bg-[#0f172a] border-t border-white/5 flex justify-between items-center opacity-50">
        <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase">Session ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase tracking-[0.2em]">© 2026 Sentinel Dynamics — Secured Intelligence Layer</span>
      </footer>
    </div>
  );
}

export default App;
