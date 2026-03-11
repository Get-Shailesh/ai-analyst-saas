import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export function Card({ children, className, glow, hover }: CardProps) {
  return (
    <div className={cn(
      "rounded-xl bg-dark-400 border border-dark-300 p-5",
      glow && "border-brand/40 shadow-[0_0_20px_rgba(0,245,160,0.08)]",
      hover && "hover:border-brand/30 hover:shadow-md transition-all cursor-pointer",
      className
    )}>
      {children}
    </div>
  );
}
