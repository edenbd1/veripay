"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { DocSection } from "@/components/documentation/DocSection";
import { APIEndpoint } from "@/components/documentation/APIEndpoint";

const TOC = [
  { id: "presentation", label: "Présentation" },
  { id: "erreurs", label: "Erreurs détectées" },
  { id: "fonctionnement", label: "Fonctionnement" },
  { id: "api", label: "API Endpoints" },
  { id: "formats", label: "Formats supportés" },
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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="animate-fade-in-up mb-10">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Documentation</h1>
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
                  "block rounded-lg px-3 py-1.5 text-sm transition-all duration-150",
                  activeSection === item.id
                    ? "bg-surface font-medium text-foreground shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
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
              VeriPay est un outil de vérification automatique des bulletins de paie
              français. Il analyse les PDF de bulletins de salaire émis sous la{" "}
              <strong className="text-foreground">Convention collective du 15 mars 1966 (CCNT 66)</strong> et
              détecte les erreurs de paramétrage courantes dans les logiciels de paie.
            </p>
          </DocSection>

          <DocSection id="erreurs" title="Erreurs détectées">
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    TIAFM
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    Plafond de Sécurité sociale (PMSS)
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Détecte quand le PMSS est resté à la valeur 2025 (<strong>3 925 €</strong>) au lieu
                  d&apos;être mis à jour à <strong>4 005 €</strong> pour 2026. Cette erreur impacte
                  toutes les cotisations plafonnées (Vieillesse TA, Retraite T1, Prévoyance, etc.).
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    AAICO
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    SMIC mensuel
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Détecte une erreur de saisie sur le SMIC mensuel 151,67 h : <strong>1 832,03 €</strong> (erroné)
                  au lieu de <strong>1 823,03 €</strong> (correct). Impact sur le calcul de la RGDU.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    RGDUB
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    Coefficient RGDU (T delta)
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Détecte un coefficient T delta mal paramétré dans le calcul de la Réduction Générale
                  des Cotisations (RGDU) : <strong>0,3241</strong> (erroné) au lieu de{" "}
                  <strong>0,3821</strong> (correct 2026). La formule RGDU est :{" "}
                  <code className="rounded bg-slate-200 px-1 py-0.5 text-[10px] dark:bg-zinc-700">
                    C = T_min + T_delta x [(1/2) x (3 x SMIC / brut - 1)]^P
                  </code>
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection id="fonctionnement" title="Comment fonctionne l'analyse ?">
            <ol className="space-y-3 text-sm text-muted">
              {[
                { step: "1", title: "Extraction", desc: "Le texte du PDF est extrait et les bulletins individuels sont identifiés." },
                { step: "2", title: "Parsing", desc: "Chaque bulletin est parsé en structure JSON (employeur, salarié, cotisations, etc.)." },
                { step: "3", title: "Détection", desc: "Les paramètres (PMSS, SMIC, coeff. RGDU) sont comparés aux valeurs 2026 attendues." },
                { step: "4", title: "Résultat", desc: "Chaque bulletin reçoit un statut valide/invalide avec les erreurs détaillées." },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
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
                description="Upload un PDF → retourne les erreurs de paramétrage par bulletin. Body : multipart/form-data, champ pdf."
              />
              <APIEndpoint
                method="POST"
                path="/bulletins/upload"
                description="Upload un PDF → retourne les bulletins parsés en JSON avec vérification complète."
              />
              <APIEndpoint
                method="POST"
                path="/bulletins/verifier"
                description="Vérifie un bulletin JSON déjà extrait. Body : { bulletin: {...} }."
              />
              <APIEndpoint
                method="GET"
                path="/bulletins/sante"
                description="Health check de l'API."
              />
            </div>
          </DocSection>

          <DocSection id="formats" title="Formats de bulletins supportés">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs font-medium text-foreground">Bulletin détaillé</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Chaque cotisation sur une ligne avec code (20000, 20200, etc.), base, taux, et montants salarié/patronal.
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs font-medium text-foreground">Bulletin clarifié</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Cotisations regroupées par catégorie (Santé, Retraite, Famille, Chômage, Impôt sur le revenu).
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Le type est détecté automatiquement. Un PDF peut contenir plusieurs bulletins qui seront analysés individuellement.
            </p>
          </DocSection>
        </div>
      </div>
    </div>
  );
}
