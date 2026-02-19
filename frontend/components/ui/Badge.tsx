import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "error" | "warning";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-white/60",
  success: "bg-white/10 text-white/80",
  error: "bg-white text-black",
  warning: "bg-white/15 text-white/70",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
