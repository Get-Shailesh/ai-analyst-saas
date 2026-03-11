import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:   "bg-gradient-to-r from-brand to-purple-500 text-dark-600 font-bold hover:opacity-90",
  secondary: "bg-dark-400 border border-dark-300 text-dark-50 hover:border-brand/40",
  ghost:     "text-dark-200 hover:text-dark-50 hover:bg-dark-400",
  danger:    "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30",
};

const sizes = {
  sm:  "px-3 py-1.5 text-xs rounded-lg",
  md:  "px-4 py-2.5 text-sm rounded-xl",
  lg:  "px-6 py-3 text-base rounded-xl",
};

export function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
