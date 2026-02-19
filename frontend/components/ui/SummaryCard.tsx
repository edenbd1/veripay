import { cn } from "@/lib/cn";

interface SummaryCardProps {
  label: string;
  value: number;
  color?: "emerald" | "red";
}

export function SummaryCard({ label, value, color }: SummaryCardProps) {
  const colorClass =
    color === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : color === "red"
        ? "text-red-600 dark:text-red-400"
        : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", colorClass)}>
        {value}
      </p>
    </div>
  );
}
