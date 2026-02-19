import { SAMPLE_PDFS } from "@/lib/constants";

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
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-all duration-150 hover:border-border-hover active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-[10px] font-bold text-foreground">
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
            <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-muted">
              {s.hasErrors ? "Erreurs" : "Valide"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
