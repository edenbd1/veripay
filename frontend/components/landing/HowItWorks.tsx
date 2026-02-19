"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Glissez votre PDF de bulletin(s) de paie ou selectionnez un fichier.",
  },
  {
    number: "02",
    title: "Extraction",
    description: "Le texte est extrait et les bulletins individuels sont identifies automatiquement.",
  },
  {
    number: "03",
    title: "Analyse",
    description: "Les parametres (PMSS, SMIC, coeff. RGDU) sont compares aux valeurs 2026 attendues.",
  },
  {
    number: "04",
    title: "Resultats",
    description: "Chaque bulletin recoit un statut valide/invalide avec les erreurs detaillees.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            COMMENT CA MARCHE
          </p>
        </SectionReveal>

        <SectionReveal stagger>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="bg-surface p-8">
                <p className="mb-4 font-mono text-xs text-muted-foreground">{step.number}</p>
                <h3 className="mb-2 text-sm font-bold text-foreground">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
