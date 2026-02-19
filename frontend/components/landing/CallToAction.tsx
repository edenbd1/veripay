"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionReveal } from "@/components/ui/SectionReveal";

export function CallToAction() {
  return (
    <section className="bg-white py-24 text-black">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pret a verifier vos bulletins ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-black/50">
              Uploadez un PDF et detectez les erreurs de parametrage en quelques secondes. Aucune inscription necessaire.
            </p>
            <div className="mt-10">
              <Link href="/analyser">
                <Button className="bg-black text-white hover:bg-black/90 px-8 py-3.5 text-base">
                  Commencer l&apos;analyse
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
