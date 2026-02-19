import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "error" | "warning";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  success: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200",
  error: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
  warning: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
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
