import * as React from "react";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? "span" : "button";

    const variants = {
      default:
        "border border-slate-300/90 bg-slate-100 text-slate-900 hover:bg-slate-200",
      primary:
        "border border-sky-400/60 bg-sky-500 text-slate-950 hover:bg-sky-400",
      destructive:
        "border border-red-500/50 bg-red-500/90 text-white hover:bg-red-500",
      outline:
        "border border-slate-500/65 bg-slate-900/70 text-slate-100 hover:bg-slate-800/80",
      secondary:
        "border border-slate-600/70 bg-slate-800/80 text-slate-100 hover:bg-slate-700/85",
      ghost:
        "text-slate-200 hover:bg-slate-800/70 hover:text-slate-100",
      link: "text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline",
    };

    const sizes = {
      default: "h-10 px-6 py-2",
      sm: "h-9 rounded-md px-4 text-sm",
      lg: "h-12 rounded-md px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <Comp
        className={`inline-flex items-center justify-center rounded-lg text-sm font-semibold ring-offset-slate-950 transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
