import * as React from "react";

const Alert = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "border-slate-600/70 bg-slate-900/70 text-slate-100 premium-card [&>svg]:text-slate-300",
      destructive:
        "border-red-500/45 bg-red-500/12 text-red-100 premium-card [&>svg]:text-red-200",
      warning:
        "border-amber-500/45 bg-amber-500/12 text-amber-100 premium-card [&>svg]:text-amber-200",
      success:
        "border-emerald-500/45 bg-emerald-500/12 text-emerald-100 premium-card [&>svg]:text-emerald-200",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 [&>svg~div]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 ${variants[variant]} ${className || ""}`}
        {...props}
      />
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-semibold leading-none tracking-tight ${className || ""}`}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className || ""}`}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
