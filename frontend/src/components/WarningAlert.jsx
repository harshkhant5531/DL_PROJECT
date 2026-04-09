import { AlertCircle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

const ALERT_STYLE = {
  safe: {
    icon: CheckCircle2,
    title: "System Normal",
    message: "Session stable. No suspicious pattern detected.",
    accent: "border-l-emerald-400/65",
    badge: "border-emerald-500/45 bg-emerald-500/15 text-emerald-100",
    iconWrap: "border-emerald-500/35 bg-emerald-500/15 text-emerald-200",
  },
  low: {
    icon: Info,
    title: "Low Risk",
    message: "Light deviation observed. Continue monitoring.",
    accent: "border-l-sky-400/65",
    badge: "border-sky-500/40 bg-sky-500/15 text-sky-100",
    iconWrap: "border-sky-500/35 bg-sky-500/15 text-sky-200",
  },
  medium: {
    icon: ShieldAlert,
    title: "Medium Risk",
    message: "Suspicious gaze pattern detected.",
    accent: "border-l-amber-400/65",
    badge: "border-amber-500/45 bg-amber-500/15 text-amber-100",
    iconWrap: "border-amber-500/35 bg-amber-500/15 text-amber-200",
  },
  high: {
    icon: AlertCircle,
    title: "High Risk",
    message: "Critical integrity signal triggered.",
    accent: "border-l-red-400/65",
    badge: "border-red-500/45 bg-red-500/15 text-red-100",
    iconWrap: "border-red-500/35 bg-red-500/15 text-red-200",
  },
  unknown: {
    icon: Info,
    title: "Status Unavailable",
    message: "Risk signal is temporarily unavailable.",
    accent: "border-l-slate-400/65",
    badge: "border-slate-500/45 bg-slate-500/15 text-slate-100",
    iconWrap: "border-slate-500/35 bg-slate-500/15 text-slate-200",
  },
};

function WarningAlert({ warning = false, message = "", severity = "low" }) {
  const levelKey = warning ? severity.toLowerCase() : "safe";
  const current = ALERT_STYLE[levelKey] || ALERT_STYLE.unknown;
  const Icon = current.icon;
  const stateLabel = warning ? `${current.title} alert` : "No active alert";

  return (
    <article
      role={warning ? "alert" : "status"}
      aria-live={warning ? "assertive" : "polite"}
      className={`premium-card border-l-4 p-4 md:p-5 ${current.accent}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg border p-2 ${current.iconWrap}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Alert Status
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-100">{current.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {message || current.message}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${current.badge}`}
        >
          {stateLabel}
        </span>
      </div>
    </article>
  );
}

export default WarningAlert;
