import { SAMPLE_PDFS } from "@/lib/constants";
import { cn } from "@/lib/cn";

interface SamplePDFListProps {
  loading: boolean;
  onSelect: (name: string) => void;
}

export function SamplePDFList({ loading, onSelect }: SamplePDFListProps) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-foreground">
        Fichiers de test
      </h3>
      <p className="mb-4 text-xs text-muted">
        Cliquez pour tester avec un fichier d&apos;exemple.
      </p>
      <div className="space-y-2">
        {SAMPLE_PDFS.map((s) => (
          <button
            key={s.name}
            onClick={() => onSelect(s.name)}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-all duration-150 hover:border-border-hover hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                s.hasErrors
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              )}
            >
              PDF
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {s.label}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {s.name}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                s.hasErrors
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
              )}
            >
              {s.hasErrors ? "Erreurs" : "Valide"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
