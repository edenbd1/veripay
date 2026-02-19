"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-24 md:pb-32 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Logo icon */}
          <div className="animate-fade-in mb-8 inline-flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Image src="/logo.webp" alt="" width={28} height={28} className="rounded-lg" />
            </div>
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-[3.5rem] md:leading-[1.1]">
            Des bulletins fiables.
            <br />
            Pas des erreurs de paie.
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg" style={{ animationDelay: "100ms" }}>
            Pour les gestionnaires de paie CCNT 66 qui veulent des bulletins conformes, pas des surprises au controle URSSAF.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up mt-10" style={{ animationDelay: "200ms" }}>
            <Link href="/analyser">
              <Button className="px-8 py-3.5 text-base">
                Analyser vos bulletins
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
