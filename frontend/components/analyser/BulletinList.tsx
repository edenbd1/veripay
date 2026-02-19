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
            "rounded-2xl border bg-surface px-5 py-3.5 transition-all",
            b.valide
              ? "border-border"
              : "border-white/15"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  b.valide
                    ? "bg-white/10"
                    : "bg-white text-black"
                )}
              >
                {b.valide ? (
                  <svg className="h-3.5 w-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
              <div className="flex gap-1.5">
                {b.erreurs.map((err, j) => (
                  <span
                    key={j}
                    className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-black"
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
