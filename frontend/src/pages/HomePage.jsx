import { ArrowRight, BrainCircuit, Camera, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURE_CARDS = [
  {
    title: "Research-grade inference",
    description:
      "MPIIGaze eye embeddings and head-pose fusion keep directional output dependable in practical camera setups.",
    icon: BrainCircuit,
  },
  {
    title: "Operational monitoring",
    description:
      "Live scoring highlights direction changes, warning context, and confidence trends for fast reviews.",
    icon: Zap,
  },
  {
    title: "Deployment-aware privacy",
    description:
      "Session telemetry is purpose-built, helping teams demo outcomes without retaining full video streams.",
    icon: ShieldCheck,
  },
];

const SHOWCASE_POINTS = [
  {
    label: "Demo objective",
    value: "Stakeholder clarity",
    note: "Translate model behavior into business-ready conclusions.",
  },
  {
    label: "Primary workflow",
    value: "Live + benchmark review",
    note: "Move from camera evidence to measurable reliability.",
  },
  {
    label: "Audience fit",
    value: "Product, research, ops",
    note: "One narrative for technical and non-technical teams.",
  },
];

const PIPELINE_STEPS = [
  {
    title: "Capture and normalize",
    description:
      "MediaPipe landmarks align face and eye regions into model-ready inputs from webcam frames.",
  },
  {
    title: "Infer gaze direction",
    description:
      "The MPIIGaze network predicts pitch and yaw while guardrails stabilize edge-case behavior.",
  },
  {
    title: "Surface session signals",
    description:
      "Direction shifts, confidence, and warnings are organized into a concise monitoring timeline.",
  },
];

function HomePage() {
  return (
    <div className="space-y-6 md:space-y-7">
      <section className="premium-card p-6 md:p-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-800/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
          <Camera size={14} />
          MPIIGaze Showcase
        </div>

        <h2 className="mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight text-slate-100 md:text-5xl">
          Professional monitoring presentation for real-time gaze intelligence.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
          This interface packages MPIIGaze into a stakeholder-ready story with
          live inference, benchmark evidence, and implementation context.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/live-demo"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-slate-200"
          >
            Open Live Demo
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/benchmarks"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/70 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-100 transition hover:border-slate-500 hover:bg-slate-800/80"
          >
            View Benchmarks
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {SHOWCASE_POINTS.map((point) => (
            <div
              key={point.label}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {point.label}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-100">
                {point.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {point.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURE_CARDS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="premium-card p-5 md:p-6">
              <div className="mb-4 inline-flex rounded-xl border border-slate-600/80 bg-slate-800/70 p-2 text-sky-300">
                <Icon size={18} />
              </div>
              <h3 className="font-display text-xl font-semibold text-slate-100">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="premium-card p-6 md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          End-to-End Flow
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-slate-100">
          Camera signal to interpretable monitoring output
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          Each stage exposes context that helps teams explain model behavior with
          confidence during demos and reviews.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {PIPELINE_STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 md:p-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Step {index + 1}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-slate-100">
                {step.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
