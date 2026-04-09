import { useCallback, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Eye,
  PauseCircle,
  PlayCircle,
  Radar,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import WebcamFeed from "../components/WebcamFeed";
import WarningAlert from "../components/WarningAlert";
import GazeIndicator from "../components/GazeIndicator";
import BehaviorTimeline from "../components/BehaviorTimeline";
import AttentionScoreMeter from "../components/AttentionScoreMeter";

const BASE_GAZE_DATA = {
  gaze_direction: "center",
  cheating_risk: "low",
  warning: false,
  attention_score: 100,
  warning_message: "",
  warning_count: 0,
  gaze_vector: [0, 0, 0],
};

const RISK_STYLE = {
  low: {
    icon: ShieldCheck,
    label: "Low",
    classes: "border-emerald-500/45 bg-emerald-500/15 text-emerald-100",
    note: "No significant deviation",
  },
  medium: {
    icon: ShieldAlert,
    label: "Medium",
    classes: "border-amber-500/45 bg-amber-500/15 text-amber-100",
    note: "Monitor closely",
  },
  high: {
    icon: AlertTriangle,
    label: "High",
    classes: "border-red-500/50 bg-red-500/15 text-red-100",
    note: "Intervention recommended",
  },
  unknown: {
    icon: Activity,
    label: "Unknown",
    classes: "border-slate-500/45 bg-slate-500/15 text-slate-100",
    note: "Awaiting telemetry",
  },
};

const MONITORING_STYLE = {
  active: "border-emerald-500/45 bg-emerald-500/12 text-emerald-100",
  paused: "border-slate-600/70 bg-slate-800/70 text-slate-200",
};

function LiveDemoPage() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [gazeData, setGazeData] = useState(BASE_GAZE_DATA);
  const [events, setEvents] = useState([]);

  const eventCounterRef = useRef(0);
  const lastDirectionRef = useRef(BASE_GAZE_DATA.gaze_direction);
  const lastWarningRef = useRef("");

  const appendEvent = useCallback((message) => {
    setEvents((prev) => {
      eventCounterRef.current += 1;
      const event = {
        id: eventCounterRef.current,
        time: new Date(),
        message,
      };
      return [...prev.slice(-39), event];
    });
  }, []);

  const toggleMonitoring = useCallback(() => {
    setIsMonitoring((current) => {
      const next = !current;
      appendEvent(next ? "Live inference started." : "Live inference paused.");
      if (!next) {
        setGazeData(BASE_GAZE_DATA);
        lastDirectionRef.current = BASE_GAZE_DATA.gaze_direction;
        lastWarningRef.current = "";
      }
      return next;
    });
  }, [appendEvent]);

  const handleTelemetryUpdate = useCallback(
    (nextData) => {
      setGazeData(nextData);

      const direction = (nextData.gaze_direction || "unknown").toLowerCase();
      if (direction !== lastDirectionRef.current) {
        appendEvent(`Direction changed: ${direction.toUpperCase()}`);
        lastDirectionRef.current = direction;
      }

      const warningMessage =
        nextData.warning && nextData.warning_message
          ? nextData.warning_message
          : "";
      if (warningMessage && warningMessage !== lastWarningRef.current) {
        appendEvent(warningMessage);
        lastWarningRef.current = warningMessage;
      }
      if (!warningMessage) {
        lastWarningRef.current = "";
      }
    },
    [appendEvent],
  );

  const riskLevel = (gazeData.cheating_risk || "unknown").toLowerCase();
  const riskConfig = RISK_STYLE[riskLevel] || RISK_STYLE.unknown;
  const RiskIcon = riskConfig.icon;
  const parsedAttentionScore = Number(gazeData.attention_score);
  const attentionScore = Number.isFinite(parsedAttentionScore)
    ? Math.max(0, Math.min(100, parsedAttentionScore))
    : 0;
  const directionValue = (gazeData.gaze_direction || "unknown")
    .toString()
    .replace(/_/g, " ")
    .toLowerCase();
  const directionLabel =
    directionValue.charAt(0).toUpperCase() + directionValue.slice(1);
  const warningCount = gazeData.warning_count ?? 0;
  const [yaw = 0, pitch = 0, roll = 0] = Array.isArray(gazeData.gaze_vector)
    ? gazeData.gaze_vector
    : [0, 0, 0];
  const vectorMetrics = [
    { label: "Yaw", value: yaw },
    { label: "Pitch", value: pitch },
    { label: "Roll", value: roll },
  ];

  return (
    <div className="space-y-5">
      <section className="premium-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Live Monitoring Console
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-100 md:text-3xl">
              Real-time MPIIGaze session oversight
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Track attention, risk signals, and direction changes while the
              camera feed is running.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isMonitoring ? MONITORING_STYLE.active : MONITORING_STYLE.paused}`}
            >
              <Activity size={14} className={isMonitoring ? "animate-pulse" : ""} />
              {isMonitoring ? "Monitoring Active" : "Monitoring Paused"}
            </span>
            <button
              type="button"
              onClick={toggleMonitoring}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-slate-950/40 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {isMonitoring ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
              {isMonitoring ? "Pause Stream" : "Start Stream"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Attention Score
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-100">
              {Math.round(attentionScore)}
              <span className="ml-1 text-base text-slate-400">%</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">Latest model confidence</p>
          </article>

          <article className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Risk State
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${riskConfig.classes}`}
            >
              <RiskIcon size={12} />
              {riskConfig.label}
            </span>
            <p className="mt-1 text-xs text-slate-400">{riskConfig.note}</p>
          </article>

          <article className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Gaze Direction
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Eye size={17} className="text-sky-300" />
              {directionLabel}
            </p>
            <p className="mt-1 text-xs text-slate-400">Direction changes are logged</p>
          </article>

          <article className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Warning Count
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{warningCount}</p>
            <p className="mt-1 text-xs text-slate-400">
              {warningCount === 0
                ? "No warning events in this run"
                : "Accumulated warning events"}
            </p>
          </article>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <WebcamFeed
            enabled={isMonitoring}
            onGazeDataUpdate={handleTelemetryUpdate}
          />

          <WarningAlert
            warning={gazeData.warning}
            message={gazeData.warning_message}
            severity={riskLevel}
          />
        </div>

        <div className="space-y-4 xl:col-span-4">
          <AttentionScoreMeter score={gazeData.attention_score ?? 0} />
          <GazeIndicator direction={gazeData.gaze_direction} />
          <BehaviorTimeline events={events} />
        </div>
      </div>

      <section className="premium-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-slate-200">
            <Radar size={16} className="text-sky-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              Model Output Vector
            </p>
          </div>
          <span className="text-xs text-slate-400">Yaw / Pitch / Roll</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {vectorMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {Number(metric.value).toFixed(3)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
          <Activity size={14} />
          Live values reflect backend prediction + heuristic fusion per frame.
        </div>
      </section>
    </div>
  );
}

export default LiveDemoPage;
