import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "error" | "warning";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-black/5 text-muted-foreground",
  success: "bg-black/5 text-foreground",
  error: "bg-foreground text-background",
  warning: "bg-black/8 text-foreground/70",
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
