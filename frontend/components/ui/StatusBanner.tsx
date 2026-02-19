import { cn } from "@/lib/cn";

interface StatusBannerProps {
  variant: "success" | "error";
  title: string;
  description?: string;
}

export function StatusBanner({ variant, title, description }: StatusBannerProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-5 py-4",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
          : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
      )}
    >
      {isSuccess ? (
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      <div>
        <p className={cn(
          "text-sm font-medium",
          isSuccess
            ? "text-emerald-800 dark:text-emerald-300"
            : "text-red-800 dark:text-red-300"
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            "mt-0.5 text-xs",
            isSuccess
              ? "text-emerald-600/70 dark:text-emerald-400/60"
              : "text-red-600/70 dark:text-red-400/60"
          )}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
