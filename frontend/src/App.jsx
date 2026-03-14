import React, { useState, useEffect, useRef } from "react";
import { Maximize, Wifi, WifiOff, MonitorDot } from "lucide-react";
import WebcamFeed from "./components/WebcamFeed";
import GazeIndicator from "./components/GazeIndicator";
import WarningAlert from "./components/WarningAlert";
import ExamTimer from "./components/ExamTimer";
import BehaviorTimeline from "./components/BehaviorTimeline";
import AttentionScoreMeter from "./components/AttentionScoreMeter";
import MCQExam from "./components/MCQExam";
import BlockingModal from "./components/BlockingModal";

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

  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const webcamRef = useRef(null);
  const lastEventRef = useRef({ message: "", at: 0 });

  const pushEvent = (message) => {
    if (!examStarted || isBlocked) return;

    const now = Date.now();
    const last = lastEventRef.current;
    if (last.message === message && now - last.at < ALERT_DEDUP_MS) {
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
      if (gazeData.warning || gazeData.error) {
        const msg = gazeData.warning_message || gazeData.error || "Suspicious behavior detected.";
        pushEvent(msg);
      }
    }
  }, [gazeData, examStarted, isBlocked]); // Watch the whole gazeData object for new frames

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
        message: "All good! Keep your eyes on the screen.",
      };
    }

    if (!isOnline) {
      return {
        warning: true,
        severity: "high",
        message: "Internet is offline. Reconnect immediately.",
      };
    }

    if (!isTabFocused) {
      return {
        warning: true,
        severity: "high",
        message: "You must return to the exam tab immediately!",
      };
    }

    if (!isFullscreen) {
      return {
        warning: true,
        severity: "medium",
        message: "Fullscreen exited. Return to fullscreen mode.",
      };
    }

    if (gazeData.error) {
      return {
        warning: true,
        severity: "high",
        message: gazeData.warning_message || "Monitoring error detected.",
      };
    }

    if (gazeData.warning) {
      return {
        warning: true,
        severity: gazeData.cheating_risk === "high" ? "high" : "medium",
        message: gazeData.warning_message || "Suspicious behavior detected.",
      };
    }

    return {
      warning: false,
      severity: "low",
      message: "All good! Keep your eyes on the screen.",
    };
  };

  const activeAlert = deriveActiveAlert();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all duration-300">
      {/* Top Navbar Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonitorDot className="text-blue-600" size={28} />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
            AI Proctoring Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${isOnline ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isOnline ? "Connected" : "Offline"}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize size={20} />
          </button>

          <ExamTimer isActive={examStarted} />
        </div>
      </header>

      {!isTabFocused && examStarted && (
        <div className="bg-red-600 text-white text-center py-2 font-bold tracking-widest text-sm shadow-md animate-pulse">
          WARNING: EXAM TAB IS NOT FOCUSED!
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Video & Live Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 md:p-6 shadow-xl shadow-blue-900/5 rounded-2xl border border-gray-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {examStarted && isOnline && !gazeData.warning ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </>
                  ) : examStarted ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-300"></span>
                  )}
                </span>
                Live Camera Feed
              </h2>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-inner bg-slate-900 aspect-video flex items-center justify-center border border-gray-200 group">
              {!examStarted ? (
                <div className="text-white text-center p-8">
                  {isBlocked ? (
                    <>
                      <div className="bg-red-500/20 p-4 rounded-xl mb-6 border border-red-500/50">
                        <MonitorDot
                          size={48}
                          className="mx-auto text-red-500 mb-4 animate-pulse"
                        />
                        <h3 className="text-2xl font-bold text-red-100 mb-2">
                          EXAM BLOCKED
                        </h3>
                        <p className="text-red-200">
                          {blockReason || "Your integrity score dropped to zero."} This session is
                          permanently disabled.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <MonitorDot
                        size={48}
                        className="mx-auto text-blue-400 mb-4 opacity-70"
                      />
                      <p className="mb-6 text-gray-300">
                        Camera permission and AI initialization required.
                      </p>
                      <button
                        onClick={() => {
                          setExamStarted(true);
                          toggleFullscreen();
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
                      >
                        Begin Exam Securely
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <WebcamFeed ref={webcamRef} onGazeDataUpdate={setGazeData} />
              )}
            </div>

            <WarningAlert
              warning={activeAlert.warning}
              severity={activeAlert.severity}
              message={activeAlert.message}
            />

            {examStarted && (
              <div className="mt-6">
                <MCQExam
                  onFinish={({ score: finalScore, total }) => {
                    setEvents((prev) => [
                      ...prev,
                      {
                        time: new Date(),
                        message: `MCQ exam completed. Score: ${finalScore}/${total}`,
                      },
                    ]);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Analytics & Indicators */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-white p-6 shadow-xl shadow-blue-900/5 rounded-2xl border border-gray-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Live AI Gaze Tracking
            </h2>
            <GazeIndicator direction={gazeData.gaze_direction} />
            <div className="mt-4 pt-4 border-t border-gray-100 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                Current State
              </p>
              <p className="font-bold text-gray-800 text-sm capitalize">
                {gazeData.gaze_direction}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 shadow-xl shadow-blue-900/5 rounded-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <AttentionScoreMeter score={gazeData.attention_score} />
          </div>

          <div className="bg-white p-6 shadow-xl shadow-blue-900/5 rounded-2xl border border-gray-100 flex-1 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-red-500"></div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Violation Timeline</h2>
              <span className={`px-2 py-1 rounded text-xs font-bold ${violationCount > 7 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                Violations: {violationCount}/10
              </span>
            </div>
            <BehaviorTimeline events={events} />
          </div>
        </div>
      </main>

      <BlockingModal 
        isOpen={isBlocked} 
        reason={blockReason} 
      />
    </div>
  );
}

export default App;
