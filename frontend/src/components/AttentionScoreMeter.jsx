import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "./ui/Badge";
import { Progress } from "./ui/Progress";

function AttentionScoreMeter({ score = 100 }) {
  const parsedScore = Number(score);
  const numericScore = Number.isFinite(parsedScore)
    ? Math.max(0, Math.min(100, parsedScore))
    : 0;

  let status = "success";
  let label = "Stable";
  let color = "text-emerald-200";
  let progressColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
  let description = "Attention profile is stable and within expected bounds.";
  let bandLabel = "80-100: Stable";
  let bandClass = "border-emerald-500/40 bg-emerald-500/15 text-emerald-100";
  let iconClass = "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
  let Icon = ShieldCheck;

  if (numericScore < 50) {
    status = "destructive";
    label = "Critical";
    color = "text-red-200";
    progressColor = "bg-gradient-to-r from-red-600 to-red-500";
    description = "Critical degradation in attention confidence.";
    bandLabel = "0-49: Critical";
    bandClass = "border-red-500/40 bg-red-500/15 text-red-100";
    iconClass = "border-red-500/35 bg-red-500/15 text-red-200";
    Icon = ShieldX;
  } else if (numericScore < 80) {
    status = "warning";
    label = "Watch";
    color = "text-amber-200";
    progressColor = "bg-gradient-to-r from-amber-500 to-orange-400";
    description = "Monitoring suggests periodic focus drift.";
    bandLabel = "50-79: Review";
    bandClass = "border-amber-500/40 bg-amber-500/15 text-amber-100";
    iconClass = "border-amber-500/35 bg-amber-500/15 text-amber-200";
    Icon = ShieldAlert;
  }

  return (
    <article className="premium-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Primary Metric
          </p>
          <h3 className="text-lg font-semibold text-slate-100">Attention Confidence</h3>
        </div>
        <Badge variant={status} className="shadow-none">
          {label}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <div className={`font-display text-4xl font-black tracking-tight ${color}`}>
            {Math.round(numericScore)}
            <span className="ml-1 text-xl text-slate-400">%</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
        <div className={`rounded-xl border p-2.5 ${iconClass}`}>
          <Icon size={24} />
        </div>
      </div>

      <div className="mt-4">
        <Progress value={numericScore} color={progressColor} className="h-2.5" />
      </div>

      <div
        className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${bandClass}`}
      >
        {bandLabel}
      </div>
    </article>
  );
}

export default AttentionScoreMeter;
