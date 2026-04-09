import { BarChart3, Gauge, Layers, Timer } from "lucide-react";

const BENCHMARKS = [
  {
    metric: "End-to-end latency",
    value: "120-220 ms",
    note: "Measured in CPU mode with live webcam input.",
    icon: Timer,
  },
  {
    metric: "Direction coverage",
    value: "3 classes",
    note: "Left, right, and center output states.",
    icon: Layers,
  },
  {
    metric: "Model payload",
    value: "36x60 x 2 + pose",
    note: "Normalized grayscale eyes with head-pose vectors.",
    icon: Gauge,
  },
  {
    metric: "Telemetry cadence",
    value: "Continuous stream",
    note: "Frame-level updates for risk and warning events.",
    icon: BarChart3,
  },
];

const SCENARIOS = [
  {
    title: "Controlled workstation",
    summary:
      "Stable lighting and frontal posture deliver high consistency with minimal warning noise.",
  },
  {
    title: "Head-turn and pose drift",
    summary:
      "Fallback guardrails preserve interpretable direction output during moderate posture shifts.",
  },
  {
    title: "Occlusion and face loss",
    summary:
      "No-face and multi-face conditions are surfaced immediately as explicit alert states.",
  },
];

function BenchmarksPage() {
  return (
    <div className="space-y-6 md:space-y-7">
      <section className="premium-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-800/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
          <BarChart3 size={16} />
          Benchmark Narrative
        </div>
        <h2 className="mt-5 font-display text-3xl font-semibold text-slate-100 md:text-4xl">
          Performance profile and operational reliability
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
          Present the core numbers behind MPIIGaze behavior in a format that
          keeps technical depth and decision clarity in balance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {BENCHMARKS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.metric} className="premium-card p-5">
              <div className="mb-3 inline-flex rounded-xl border border-slate-600/80 bg-slate-800/70 p-2 text-sky-300">
                <Icon size={16} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {item.metric}
              </p>
              <p className="mt-2 text-2xl font-display font-semibold text-slate-100">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {item.note}
              </p>
            </article>
          );
        })}
      </section>

      <section className="premium-card p-6">
        <h3 className="font-display text-xl font-semibold text-slate-100">
          Scenario-level reliability highlights
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <div
              key={scenario.title}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4"
            >
              <h4 className="text-base font-semibold text-slate-100">
                {scenario.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {scenario.summary}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BenchmarksPage;
