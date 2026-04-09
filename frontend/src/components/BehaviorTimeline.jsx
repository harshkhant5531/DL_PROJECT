import { Clock3, History } from "lucide-react";

function getEventMeta(message = "") {
  const normalized = message.toLowerCase();

  if (normalized.includes("started") || normalized.includes("paused")) {
    return {
      label: "Session",
      badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-100",
    };
  }

  if (normalized.includes("direction changed")) {
    return {
      label: "Direction",
      badgeClass: "border-indigo-500/40 bg-indigo-500/15 text-indigo-100",
    };
  }

  if (
    normalized.includes("warning") ||
    normalized.includes("risk") ||
    normalized.includes("critical")
  ) {
    return {
      label: "Alert",
      badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-100",
    };
  }

  return {
    label: "System",
    badgeClass: "border-slate-500/40 bg-slate-500/15 text-slate-100",
  };
}

function BehaviorTimeline({ events = [] }) {
  const orderedEvents = events.slice().reverse();

  return (
    <article className="premium-card flex h-[320px] flex-col p-4">
      <div className="mb-3 flex items-center justify-between border-b border-slate-700/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-slate-600/70 bg-slate-800/70 p-2 text-slate-200">
            <History size={14} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Timeline
            </p>
            <h3 className="text-sm font-semibold text-slate-100">Live Session Events</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-500/40 bg-slate-700/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200">
            {events.length} Events
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
            <Clock3 size={11} />
            Live
          </span>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto pr-1">
        {orderedEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Clock3 size={24} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]">
              Waiting for events
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Session activity will appear here in real time.
            </p>
          </div>
        ) : (
          orderedEvents.map((event) => {
            const eventDate = new Date(event.time);
            const hasValidDate = !Number.isNaN(eventDate.getTime());
            const timestamp = hasValidDate
              ? eventDate.toLocaleTimeString([], {
                  hour12: false,
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--";
            const meta = getEventMeta(event.message);

            return (
              <div
                key={event.id}
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <time
                    dateTime={hasValidDate ? eventDate.toISOString() : undefined}
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
                  >
                    {timestamp}
                  </time>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  {event.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

export default BehaviorTimeline;
