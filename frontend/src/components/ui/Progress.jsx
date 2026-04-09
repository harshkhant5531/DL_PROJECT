import * as React from "react";

const Progress = React.forwardRef(
  (
    {
      className,
      value = 0,
      color = "bg-gradient-to-r from-slate-500 to-slate-300",
      ...props
    },
    ref,
  ) => {
    const parsedValue = Number(value);
    const safeValue = Number.isFinite(parsedValue)
      ? Math.max(0, Math.min(100, parsedValue))
      : 0;

    return (
      <div
        ref={ref}
        className={`relative h-3 w-full overflow-hidden rounded-full border border-slate-700/70 bg-slate-900/70 ${className || ""}`}
        {...props}
      >
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
