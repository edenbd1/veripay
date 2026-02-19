"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { DocSection } from "@/components/documentation/DocSection";
import { APIEndpoint } from "@/components/documentation/APIEndpoint";

const TOC = [
  { id: "presentation", label: "Presentation" },
  { id: "erreurs", label: "Erreurs detectees" },
  { id: "fonctionnement", label: "Fonctionnement" },
  { id: "api", label: "API Endpoints" },
  { id: "formats", label: "Formats supportes" },
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("presentation");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0% -60% 0%" }
    );

    for (const item of TOC) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="animate-fade-in-up mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentation</h1>
        <p className="mt-2 text-sm text-muted">Tout ce que vous devez savoir sur VeriPay.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "block rounded-full px-4 py-1.5 text-sm transition-all duration-150",
                  activeSection === item.id
                    ? "bg-white font-medium text-black"
                    : "text-muted hover:text-foreground"
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="space-y-10">
          <DocSection id="presentation" title="Qu'est-ce que VeriPay ?">
            <p className="text-sm leading-relaxed text-muted">
              VeriPay est un outil de verification automatique des bulletins de paie
              francais. Il analyse les PDF de bulletins de salaire emis sous la{" "}
              <strong className="text-foreground">Convention collective du 15 mars 1966 (CCNT 66)</strong> et
              detecte les erreurs de parametrage courantes dans les logiciels de paie.
            </p>
          </DocSection>

          <DocSection id="erreurs" title="Erreurs detectees">
            <div className="space-y-4">
              <div className="rounded-xl bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-black">
                    TIAFM
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    Plafond de Securite sociale (PMSS)
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Detecte quand le PMSS est reste a la valeur 2025 (<strong className="text-foreground">3 925 &euro;</strong>) au lieu
                  d&apos;etre mis a jour a <strong className="text-foreground">4 005 &euro;</strong> pour 2026. Cette erreur impacte
                  toutes les cotisations plafonnees (Vieillesse TA, Retraite T1, Prevoyance, etc.).
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-black">
                    AAICO
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    SMIC mensuel
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Detecte une erreur de saisie sur le SMIC mensuel 151,67 h : <strong className="text-foreground">1 832,03 &euro;</strong> (errone)
                  au lieu de <strong className="text-foreground">1 823,03 &euro;</strong> (correct). Impact sur le calcul de la RGDU.
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-black">
                    RGDUB
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    Coefficient RGDU (T delta)
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Detecte un coefficient T delta mal parametre dans le calcul de la Reduction Generale
                  des Cotisations (RGDU) : <strong className="text-foreground">0,3241</strong> (errone) au lieu de{" "}
                  <strong className="text-foreground">0,3821</strong> (correct 2026). La formule RGDU est :{" "}
                  <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px]">
                    C = T_min + T_delta x [(1/2) x (3 x SMIC / brut - 1)]^P
                  </code>
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection id="fonctionnement" title="Comment fonctionne l'analyse ?">
            <ol className="space-y-3 text-sm text-muted">
              {[
                { step: "01", title: "Extraction", desc: "Le texte du PDF est extrait et les bulletins individuels sont identifies." },
                { step: "02", title: "Parsing", desc: "Chaque bulletin est parse en structure JSON (employeur, salarie, cotisations, etc.)." },
                { step: "03", title: "Detection", desc: "Les parametres (PMSS, SMIC, coeff. RGDU) sont compares aux valeurs 2026 attendues." },
                { step: "04", title: "Resultat", desc: "Chaque bulletin recoit un statut valide/invalide avec les erreurs detaillees." },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[10px] font-bold text-black">
                    {item.step}
                  </span>
                  <span>
                    <strong className="text-foreground">{item.title}</strong> : {item.desc}
                  </span>
                </li>
              ))}
            </ol>
          </DocSection>

          <DocSection id="api" title="API Endpoints">
            <div className="space-y-3">
              <APIEndpoint
                method="POST"
                path="/bulletins/analyser"
                description="Upload un PDF -> retourne les erreurs de parametrage par bulletin. Body : multipart/form-data, champ pdf."
              />
              <APIEndpoint
                method="POST"
                path="/bulletins/upload"
                description="Upload un PDF -> retourne les bulletins parses en JSON avec verification complete."
              />
              <APIEndpoint
                method="POST"
                path="/bulletins/verifier"
                description="Verifie un bulletin JSON deja extrait. Body : { bulletin: {...} }."
              />
              <APIEndpoint
                method="POST"
                path="/bulletins/chat"
                description="Chat IA pour expliquer les erreurs de parametrage. Body : { errorType, message, history[] }. Reponse en SSE streaming."
              />
              <APIEndpoint
                method="GET"
                path="/bulletins/sante"
                description="Health check de l'API."
              />
            </div>
          </DocSection>

          <DocSection id="formats" title="Formats de bulletins supportes">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-xs font-medium text-foreground">Bulletin detaille</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Chaque cotisation sur une ligne avec code (20000, 20200, etc.), base, taux, et montants salarie/patronal.
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-xs font-medium text-foreground">Bulletin clarifie</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Cotisations regroupees par categorie (Sante, Retraite, Famille, Chomage, Impot sur le revenu).
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Le type est detecte automatiquement. Un PDF peut contenir plusieurs bulletins qui seront analyses individuellement.
            </p>
          </DocSection>
        </div>
      </div>
    </div>
  );
}
