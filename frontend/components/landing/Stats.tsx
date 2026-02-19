"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";

const stats = [
  { value: "3", label: "Types d'erreurs détectées" },
  { value: "2", label: "Formats de bulletins supportés" },
  { value: "< 5s", label: "Temps d'analyse moyen" },
  { value: "100%", label: "Automatisé" },
];

export function Stats() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal stagger>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
