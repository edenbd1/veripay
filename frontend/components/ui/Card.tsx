import { cn } from "@/lib/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-6 transition-all duration-200",
        hover && "hover:border-border-hover hover:shadow-lg hover:shadow-black/30",
        className
      )}
    >
      {children}
    </div>
  );
}
