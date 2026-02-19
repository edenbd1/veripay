interface APIEndpointProps {
  method: string;
  path: string;
  description: string;
}

export function APIEndpoint({ method, path, description }: APIEndpointProps) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
      <div className="flex items-center gap-2">
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {method}
        </span>
        <code className="text-xs font-medium text-foreground">{path}</code>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}
