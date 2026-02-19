interface DocSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function DocSection({ id, title, children }: DocSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      <div className="rounded-xl border border-border bg-surface p-6">
        {children}
      </div>
    </section>
  );
}
