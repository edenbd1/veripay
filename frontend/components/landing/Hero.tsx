"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-teal-950/20" />
        <div className="animate-gradient absolute -top-24 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-3xl dark:from-emerald-900/20 dark:to-teal-900/20" />
        <div className="animate-gradient absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-200/30 to-cyan-200/30 blur-3xl dark:from-emerald-900/15 dark:to-cyan-900/15" style={{ animationDelay: "4s" }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-800 dark:bg-emerald-950/30">
            <Image src="/logo.webp" alt="" width={16} height={16} className="rounded" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Convention CCNT 66
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Vérifiez vos bulletins{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              de paie
            </span>{" "}
            en un clic
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg" style={{ animationDelay: "100ms" }}>
            Détectez automatiquement les erreurs de paramétrage 2026 dans vos bulletins de salaire. PMSS, SMIC, coefficients RGDU.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "200ms" }}>
            <Link href="/analyser">
              <Button className="px-6 py-3 text-base">
                Analyser un bulletin
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link href="/documentation">
              <Button variant="secondary" className="px-6 py-3 text-base">
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
