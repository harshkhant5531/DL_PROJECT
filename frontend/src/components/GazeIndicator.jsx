import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

const DIRECTION_CONFIG = {
  left: {
    icon: ArrowLeft,
    title: "Looking Left",
    subtitle: "Eyes shifted left from the center region.",
    iconClass: "border-sky-500/35 bg-sky-500/15 text-sky-200",
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-100",
    badge: "Direction drift",
  },
  right: {
    icon: ArrowRight,
    title: "Looking Right",
    subtitle: "Eyes shifted right from the center region.",
    iconClass: "border-sky-500/35 bg-sky-500/15 text-sky-200",
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-100",
    badge: "Direction drift",
  },
  center: {
    icon: Eye,
    title: "Centered",
    subtitle: "Attention is aligned with the active screen area.",
    iconClass: "border-emerald-500/35 bg-emerald-500/15 text-emerald-200",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
    badge: "On-screen focus",
  },
  unknown: {
    icon: EyeOff,
    title: "Unavailable",
    subtitle: "No reliable gaze signal from the current frame.",
    iconClass: "border-slate-500/35 bg-slate-700/40 text-slate-200",
    badgeClass: "border-slate-500/40 bg-slate-600/30 text-slate-100",
    badge: "Signal unavailable",
  },
};

function GazeIndicator({ direction = "center" }) {
  const rawKey = (direction || "unknown").toLowerCase();
  const key = rawKey === "up" || rawKey === "down" ? "center" : rawKey;
  const current = DIRECTION_CONFIG[key] || DIRECTION_CONFIG.unknown;
  const Icon = current.icon;

  return (
    <article className="premium-card p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Gaze Indicator
      </p>

      <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/55 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${current.iconClass}`}
            >
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{current.title}</h3>
              <p className="text-sm text-slate-300">{current.subtitle}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${current.badgeClass}`}
          >
            {current.badge}
          </span>
        </div>
      </div>
    </article>
  );
}

export default GazeIndicator;
