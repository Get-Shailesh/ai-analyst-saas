import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "purple" | "red" | "yellow" | "blue" | "gray";
  className?: string;
}

const variants = {
  brand:  "bg-brand/20  text-brand  border-brand/40",
  purple: "bg-purple-500/20 text-purple-500 border-purple-500/40",
  red:    "bg-red-500/20 text-red-400 border-red-500/40",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  blue:   "bg-blue-500/20 text-blue-400 border-blue-500/40",
  gray:   "bg-dark-300/50 text-dark-200 border-dark-300",
};

export function Badge({ children, variant = "brand", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
      variants[variant], className
    )}>
      {children}
    </span>
  );
}
