"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionReveal } from "@/components/ui/SectionReveal";

export function CallToAction() {
  return (
    <section className="border-t border-border bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Prêt à vérifier vos bulletins ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
              Uploadez un PDF et détectez les erreurs de paramétrage en quelques secondes. Aucune inscription nécessaire.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/analyser">
                <Button className="px-6 py-3 text-base">
                  Commencer l&apos;analyse
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="px-6 py-3 text-base">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
