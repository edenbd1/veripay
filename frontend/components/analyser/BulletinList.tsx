import { cn } from "@/lib/cn";
import type { ResultatBulletin } from "@/lib/types";

interface BulletinListProps {
  bulletins: ResultatBulletin[];
}

export function BulletinList({ bulletins }: BulletinListProps) {
  return (
    <div className="space-y-2">
      {bulletins.map((b, i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl border bg-surface px-4 py-3 transition-all hover:shadow-sm",
            b.valide
              ? "border-border"
              : "border-red-200 dark:border-red-900/40"
          )}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  b.valide
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                )}
              >
                {b.valide ? (
                  <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">
                  {b.salarie}
                </span>
                {b.periode && (
                  <span className="ml-2 text-xs text-muted">{b.periode}</span>
                )}
              </div>
            </div>
            {b.erreurs.length > 0 && (
              <div className="flex gap-1">
                {b.erreurs.map((err, j) => (
                  <span
                    key={j}
                    className="rounded-md bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    title={err.message}
                  >
                    {err.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
