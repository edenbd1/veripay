import { ERROR_INFO } from "@/lib/constants";
import type { ResultatBulletin } from "@/lib/types";

interface ErrorTypeSummaryProps {
  bulletins: ResultatBulletin[];
  onExplainError?: (errorType: string) => void;
}

export function ErrorTypeSummary({ bulletins, onExplainError }: ErrorTypeSummaryProps) {
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
            className="rounded-2xl border border-border bg-surface p-5 transition-all hover:border-border-hover"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-foreground px-2.5 py-0.5 font-mono text-[10px] font-bold text-background">
                {type}
              </span>
              <span className="text-xs text-muted">
                {count} bulletin{count > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {info?.label || type}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {info?.description || ""}
            </p>
            {onExplainError && (
              <button
                onClick={() => onExplainError(type)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[11px] font-medium text-foreground transition-all hover:border-border-hover hover:bg-surface-hover active:scale-95"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
                Expliquer avec l&apos;IA
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
