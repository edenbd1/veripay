import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:opacity-90 active:opacity-80",
  secondary:
    "bg-surface text-foreground border border-border hover:border-border-hover hover:bg-surface-hover",
  ghost:
    "text-muted hover:text-foreground hover:bg-surface-hover",
};

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-150",
        "active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
