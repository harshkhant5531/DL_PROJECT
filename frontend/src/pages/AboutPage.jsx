import {
  Activity,
  BookOpen,
  Cpu,
  Database,
  Globe,
  Radar,
  ShieldCheck,
} from "lucide-react";

const STACK = [
  {
    title: "Inference core",
    value: "PyTorch MPIIGaze network",
    icon: Cpu,
    detail:
      "Dual-eye encoders and pose fusion produce stable pitch and yaw estimates.",
  },
  {
    title: "Vision preprocessing",
    value: "MediaPipe landmarks",
    icon: Database,
    detail:
      "Face, iris, and eye geometry are normalized for consistent model inputs.",
  },
  {
    title: "Serving layer",
    value: "FastAPI telemetry API",
    icon: Globe,
    detail:
      "Frame endpoints publish direction, confidence, and warning context for the UI.",
  },
];

const PIPELINE_STEPS = [
  {
    step: "Step 1",
    title: "Frame acquisition + request payload",
    owner: "Frontend stream loop",
    input: "Webcam snapshot (base64 JPEG) and persisted warning counters",
    process:
      "The browser captures a frame on interval and sends it to /api/process_frame with warning_count and consecutive_away context.",
    output:
      "A frame packet is ready for backend scanning while preserving session continuity.",
  },
  {
    step: "Step 2",
    title: "Face scanning and landmark extraction",
    owner: "MediaPipe FaceLandmarker",
    input: "Decoded RGB frame",
    process:
      "The detector validates face presence, rejects multi-face frames, and returns dense facial landmarks for eyes, iris, and pose proxies.",
    output:
      "A single-face landmark set (or explicit error state such as no face / multiple faces).",
  },
  {
    step: "Step 3",
    title: "Head-pose and heuristic direction estimation",
    owner: "Geometry preprocessor",
    input: "Landmark coordinates (nose, cheeks, eye corners, iris points)",
    process:
      "Horizontal and vertical nose ratios estimate yaw/pitch bias, while iris-to-eye geometry estimates a heuristic gaze direction with confidence.",
    output:
      "head_pose, nose ratios, heuristic_direction, heuristic_confidence, and iris center coordinates.",
  },
  {
    step: "Step 4",
    title: "Eye-region crop and tensor normalization",
    owner: "Vision preprocessing",
    input: "Landmarks + RGB frame",
    process:
      "Left/right eye boxes are cropped, converted to grayscale, resized to 60x36, scaled to [0,1], then packed as 1x1x36x60 tensors.",
    output:
      "Model-ready left and right eye tensors plus normalized overlay boxes for UI rendering.",
  },
  {
    step: "Step 5",
    title: "Neural inference (pitch / yaw regression)",
    owner: "PyTorch GazeNet",
    input: "Left eye tensor, right eye tensor, and 3D pose vector",
    process:
      "Dual-eye feature extraction and pose fusion produce pitch/yaw regression output, then calibration logic converts angles into direction classes.",
    output: "Model direction label and raw gaze vector telemetry.",
  },
  {
    step: "Step 6",
    title: "Fusion policy (heuristic vs model source)",
    owner: "Decision layer",
    input: "Model direction + heuristic direction/confidence",
    process:
      "If heuristic confidence crosses threshold, heuristic direction is promoted; otherwise model output is used as authoritative direction.",
    output: "Final direction signal used for risk and warning logic.",
  },
  {
    step: "Step 7",
    title: "Risk scoring and warning generation",
    owner: "Policy engine",
    input: "Final direction, head pose condition, and current risk score",
    process:
      "Direction-specific penalties are applied per policy profile (lenient/balanced/strict), mapped into low/medium/high risk and attention score.",
    output:
      "cheating_risk, warning flag/message, attention_score, and updated warning_count.",
  },
  {
    step: "Step 8",
    title: "Telemetry response and dashboard rendering",
    owner: "FastAPI + React UI",
    input: "Structured ProcessResponse payload",
    process:
      "The API returns direction, gaze vector, risk telemetry, eye overlays, and warning context; the dashboard updates cards, timeline, and indicators.",
    output: "Live model summary visible to operators in the monitoring console.",
  },
];

const OUTPUT_SIGNALS = [
  {
    label: "Core direction output",
    value: "gaze_direction + gaze_vector",
    detail:
      "Direction class and angle-derived vector used by the live indicator and model-output panel.",
  },
  {
    label: "Integrity scoring",
    value: "warning_count + cheating_risk + attention_score",
    detail:
      "Persistent session scoring transformed into low/medium/high state and operator-facing attention percentage.",
  },
  {
    label: "Visual evidence",
    value: "left_eye_box/right_eye_box + iris points + eye centers",
    detail:
      "Normalized overlay coordinates that explain what region and geometry were used for each frame decision.",
  },
  {
    label: "Operational diagnostics",
    value: "warning_message + error",
    detail:
      "Explicit failure and warning context (no face, multiple faces, backend error, suspicious gaze, etc.).",
  },
];

const POSITIONING = [
  {
    title: "Product leadership",
    summary:
      "Use a clear capability narrative to support roadmap and pilot discussions.",
  },
  {
    title: "Research and data teams",
    summary:
      "Trace each stage from input normalization to model output for technical review.",
  },
  {
    title: "Client stakeholders",
    summary:
      "Present measurable behavior with concise visuals that fit executive updates.",
  },
];

function AboutPage() {
  return (
    <div className="space-y-6 md:space-y-7">
      <section className="premium-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-800/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
          <BookOpen size={14} />
          Solution Context
        </div>
        <h2 className="mt-5 font-display text-3xl font-semibold text-slate-100 md:text-4xl">
          Why this MPIIGaze implementation is presentation-ready
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
          The page explains how research-grade gaze estimation is delivered in a
          production-style interface, so teams can assess capability and
          readiness in one walkthrough.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {STACK.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="premium-card p-5">
              <div className="mb-3 inline-flex rounded-xl border border-slate-600/80 bg-slate-800/70 p-2 text-sky-300">
                <Icon size={17} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {item.title}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-100">
                {item.value}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {item.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="premium-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-800/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
          <Radar size={14} />
          Detailed Model Summary
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-slate-100 md:text-3xl">
          End-to-end frame lifecycle (every step in production order)
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300 md:text-base">
          Each processed frame follows the exact chain below: capture, face
          scanning, geometric analysis, neural inference, fusion, policy
          scoring, and UI telemetry. This sequence is the same path used by the
          live monitoring console.
        </p>

        <div className="mt-5 space-y-3">
          {PIPELINE_STEPS.map((item) => (
            <article
              key={item.step}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 md:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex rounded-full border border-slate-600/80 bg-slate-800/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                  {item.step}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                  {item.owner}
                </span>
              </div>
              <h4 className="mt-3 text-lg font-semibold text-slate-100">
                {item.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-100">Input:</span>{" "}
                {item.input}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-100">Processing:</span>{" "}
                {item.process}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-100">Output:</span>{" "}
                {item.output}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {OUTPUT_SIGNALS.map((item) => (
          <article key={item.label} className="premium-card p-5">
            <div className="mb-3 inline-flex rounded-xl border border-slate-600/80 bg-slate-800/70 p-2 text-sky-300">
              <Activity size={16} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {item.label}
            </p>
            <h4 className="mt-1 text-base font-semibold text-slate-100">
              {item.value}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="premium-card p-6">
        <h3 className="font-display text-xl font-semibold text-slate-100">
          Where this experience adds value
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {POSITIONING.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4"
            >
              <p className="text-sm font-semibold text-slate-100">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-card p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="inline-flex rounded-xl border border-slate-600/80 bg-slate-800/70 p-2 text-sky-300">
            <ShieldCheck size={17} />
          </div>
          <div className="max-w-3xl">
            <h3 className="font-display text-xl font-semibold text-slate-100">
              Why this summary helps operators
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Teams can now trace each prediction from raw frame to final risk
              state, making debugging faster, demos clearer, and model behavior
              easier to explain to both technical and non-technical audiences.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
