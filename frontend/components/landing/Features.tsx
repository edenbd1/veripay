"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";

const features = [
  {
    title: "DETECTION",
    description: "PMSS, SMIC, coefficients RGDU : 3 types d'erreurs de parametrage identifies automatiquement sur vos bulletins 2026.",
  },
  {
    title: "ANALYSE",
    description: "Uploadez un PDF, obtenez les resultats en quelques secondes. Support multi-bulletins avec detection automatique du format.",
  },
  {
    title: "API",
    description: "Integrez la verification dans vos outils existants via notre API REST simple. Upload PDF, verification JSON, health check.",
  },
];

export function Features() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            LE SYSTEME VERIPAY
          </p>
        </SectionReveal>

        <SectionReveal stagger>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-surface p-8 transition-all duration-200 hover:border-border-hover"
              >
                <p className="mb-3 text-sm font-bold tracking-wide text-foreground">
                  {f.title}
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  {f.description}
                </p>
                {i < features.length - 1 && (
                  <div className="mt-4 hidden text-muted-foreground md:hidden">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
