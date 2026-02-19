"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";

const stats = [
  { label: "TYPES D'ERREURS", value: "3", description: "PMSS, SMIC et coefficients RGDU detectes automatiquement" },
  { label: "FORMATS SUPPORTES", value: "2", description: "Bulletins detailles et clarifies sous CCNT 66" },
  { label: "TEMPS D'ANALYSE", value: "< 5s", description: "Resultats instantanes, meme sur des PDF multi-bulletins" },
];

export function Stats() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            RESULTATS
          </p>
        </SectionReveal>

        <SectionReveal stagger>
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-surface p-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{stat.description}</p>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
