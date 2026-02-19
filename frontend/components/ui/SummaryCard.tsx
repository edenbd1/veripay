import { cn } from "@/lib/cn";

interface SummaryCardProps {
  label: string;
  value: number;
  color?: "emerald" | "red";
}

export function SummaryCard({ label, value, color }: SummaryCardProps) {
  const colorClass =
    color === "red" && value > 0
      ? "text-foreground"
      : "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", colorClass)}>
        {value}
      </p>
    </div>
  );
}
