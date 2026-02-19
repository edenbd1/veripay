"use client";

import { Card } from "@/components/ui/Card";
import { SectionReveal } from "@/components/ui/SectionReveal";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Détection précise",
    description: "Identification automatique de 3 types d'erreurs de paramétrage : PMSS, SMIC et coefficients RGDU pour l'année 2026.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Analyse instantanée",
    description: "Uploadez un PDF et obtenez les résultats en quelques secondes. Support des bulletins multi-pages avec détection automatique.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: "API REST",
    description: "Intégrez la vérification dans vos outils via notre API simple. Upload PDF, vérification JSON, health check.",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Tout ce qu&apos;il faut pour vérifier vos paies
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
              Un outil simple et puissant pour détecter les erreurs de paramétrage dans vos bulletins de salaire.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal stagger>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} hover>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.description}</p>
              </Card>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
