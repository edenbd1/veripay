interface APIEndpointProps {
  method: string;
  path: string;
  description: string;
}

export function APIEndpoint({ method, path, description }: APIEndpointProps) {
  return (
    <div className="rounded-xl bg-foreground/[0.03] p-4 dark:bg-foreground/[0.05]">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-foreground px-2.5 py-0.5 font-mono text-[10px] font-bold text-background">
          {method}
        </span>
        <code className="text-xs font-medium text-foreground">{path}</code>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}
