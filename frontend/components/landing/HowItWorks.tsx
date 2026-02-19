"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";

const steps = [
  {
    number: "1",
    title: "Upload",
    description: "Glissez votre PDF de bulletin(s) de paie ou sélectionnez un fichier.",
  },
  {
    number: "2",
    title: "Extraction",
    description: "Le texte est extrait et les bulletins individuels sont identifiés automatiquement.",
  },
  {
    number: "3",
    title: "Analyse",
    description: "Les paramètres (PMSS, SMIC, coeff. RGDU) sont comparés aux valeurs 2026 attendues.",
  },
  {
    number: "4",
    title: "Résultats",
    description: "Chaque bulletin reçoit un statut valide/invalide avec les erreurs détaillées.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Comment ça marche
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
              4 étapes automatiques, de l&apos;upload à la détection des erreurs.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal stagger>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {step.number}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
