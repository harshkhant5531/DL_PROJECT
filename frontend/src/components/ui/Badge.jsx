import * as React from "react";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default:
      "border border-slate-500/45 bg-slate-700/35 text-slate-100 hover:bg-slate-700/55",
    secondary:
      "border border-indigo-500/40 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25",
    destructive:
      "border border-red-500/40 bg-red-500/15 text-red-100 hover:bg-red-500/25",
    outline:
      "border border-slate-500/45 bg-transparent text-slate-200 hover:bg-slate-800/55",
    success:
      "border border-emerald-500/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
    warning:
      "border border-amber-500/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300/60 focus:ring-offset-2 focus:ring-offset-slate-950 ${variants[variant]} ${className || ""}`}
      {...props}
    />
  );
}

export { Badge };
