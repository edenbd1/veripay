import { Skeleton } from "@/components/ui/Skeleton";

interface AnalysisLoadingProps {
  fileName: string | null;
}

export function AnalysisLoading({ fileName }: AnalysisLoadingProps) {
  return (
    <div className="animate-fade-in py-10">
      <div className="mb-8 flex flex-col items-center justify-center">
        <div className="relative">
          <svg className="h-10 w-10 animate-spin text-foreground" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Analyse en cours...</p>
        {fileName && <p className="mt-1 text-xs text-muted">{fileName}</p>}
      </div>

      {/* Skeleton results */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
