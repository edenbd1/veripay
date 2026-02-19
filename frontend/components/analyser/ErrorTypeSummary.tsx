import { ERROR_INFO } from "@/lib/constants";
import type { ResultatBulletin } from "@/lib/types";

interface ErrorTypeSummaryProps {
  bulletins: ResultatBulletin[];
}

export function ErrorTypeSummary({ bulletins }: ErrorTypeSummaryProps) {
  const errorCounts = bulletins
    .flatMap((b) => b.erreurs)
    .reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  if (Object.keys(errorCounts).length === 0) return null;

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {Object.entries(errorCounts).map(([type, count]) => {
        const info = ERROR_INFO[type];
        return (
          <div
            key={type}
            className="rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-md bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {type}
              </span>
              <span className="text-xs text-muted">
                {count} bulletin{count > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs font-medium text-foreground">
              {info?.label || type}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {info?.description || ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
