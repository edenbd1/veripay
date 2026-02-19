"use client";

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ErreurBulletin {
  type: "TIAFM" | "AAICO" | "RGDUB" | "autre";
  message: string;
}

interface ResultatBulletin {
  salarie: string;
  periode: string;
  valide: boolean;
  erreurs: ErreurBulletin[];
}

interface ResultatAnalyse {
  nombreBulletins: number;
  nombrePages: number;
  bulletins: ResultatBulletin[];
}

const SAMPLE_PDFS = [
  {
    name: "bulletin_1_sans_erreur_detaille.pdf",
    label: "1 bulletin sans erreur",
    hasErrors: false,
  },
  {
    name: "bulletin_3_sans_erreur_detaille.pdf",
    label: "3 bulletins sans erreur",
    hasErrors: false,
  },
  {
    name: "bulletin_4_5_sans_erreur_detaille.pdf",
    label: "4-5 bulletins sans erreur",
    hasErrors: false,
  },
  {
    name: "bulletin_sans_erreur_version_detaille.pdf",
    label: "31 bulletins sans erreur",
    hasErrors: false,
  },
  {
    name: "bulletin_en_erreur_version_detaille.pdf",
    label: "12 bulletins avec erreurs",
    hasErrors: true,
  },
];

const ERROR_INFO: Record<string, { label: string; description: string; color: string }> = {
  TIAFM: {
    label: "PMSS incorrect",
    description: "Le plafond mensuel de la Sécurité sociale est resté à la valeur 2025 (3 925 €) au lieu de 4 005 € en 2026.",
    color: "amber",
  },
  AAICO: {
    label: "SMIC erroné",
    description: "Erreur de frappe sur le SMIC mensuel (1 832,03 € au lieu de 1 823,03 €).",
    color: "orange",
  },
  RGDUB: {
    label: "Coefficient RGDU",
    description: "Le coefficient T delta de la RGDU est mal paramétré (0,3241 au lieu de 0,3821).",
    color: "red",
  },
};

type Tab = "analyser" | "documentation";

export default function Home() {
  const [tab, setTab] = useState<Tab>("analyser");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultatAnalyse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    setFile(f);
    setFileName(f.name);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const analyzeFile = async (formData: FormData, name: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(name);

    try {
      const res = await fetch(`${API_URL}/bulletins/analyser`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.erreur || `Erreur ${res.status}`);
      }

      const data: ResultatAnalyse = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'analyse"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);
    await analyzeFile(formData, file.name);
  };

  const handleSample = async (sampleName: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFile(null);
    setFileName(sampleName);

    try {
      const pdfRes = await fetch(`/samples/${sampleName}`);
      if (!pdfRes.ok) throw new Error("Impossible de charger le fichier sample");
      const blob = await pdfRes.blob();

      const formData = new FormData();
      formData.append("pdf", new File([blob], sampleName, { type: "application/pdf" }));
      await analyzeFile(formData, sampleName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setFileName(null);
    setResult(null);
    setError(null);
  };

  const totalErreurs = result
    ? result.bulletins.reduce((s, b) => s + b.erreurs.length, 0)
    : 0;
  const totalValides = result
    ? result.bulletins.filter((b) => b.valide).length
    : 0;
  const totalInvalides = result ? result.nombreBulletins - totalValides : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 font-mono text-xs font-bold text-white">
              VP
            </div>
            <span className="text-base font-semibold tracking-tight">VeriPay</span>
          </div>
          <nav className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-zinc-800">
            <button
              onClick={() => setTab("analyser")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "analyser"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
              }`}
            >
              Analyser
            </button>
            <button
              onClick={() => setTab("documentation")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "documentation"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
              }`}
            >
              Documentation
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {tab === "documentation" && <Documentation />}

        {tab === "analyser" && (
          <>
            {/* Upload + Results */}
            {!result && !loading && (
              <div className="grid gap-8 lg:grid-cols-5">
                {/* Upload zone */}
                <div className="lg:col-span-3">
                  <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-zinc-100">
                    Analyser un bulletin
                  </h2>
                  <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">
                    Uploadez un PDF de bulletin(s) de paie pour détecter les erreurs de paramétrage.
                  </p>

                  <div
                    className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                      dragActive
                        ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10"
                        : file
                          ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/5"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFile(e.target.files[0]);
                      }}
                    />
                    {file ? (
                      <>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{file.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{(file.size / 1024).toFixed(0)} Ko</p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
                          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">Glissez un PDF ici</p>
                        <p className="mt-0.5 text-xs text-slate-400">ou cliquez pour sélectionner (max 10 Mo)</p>
                      </>
                    )}
                  </div>

                  {error && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!file || loading}
                    className="mt-4 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Analyser le bulletin
                  </button>
                </div>

                {/* Sample PDFs */}
                <div className="lg:col-span-2">
                  <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Fichiers de test
                  </h3>
                  <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
                    Cliquez pour tester avec un fichier d&apos;exemple.
                  </p>
                  <div className="space-y-2">
                    {SAMPLE_PDFS.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleSample(s.name)}
                        disabled={loading}
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-slate-300 hover:shadow-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                          s.hasErrors
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}>
                          PDF
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-700 dark:text-zinc-300">
                            {s.label}
                          </p>
                          <p className="truncate text-[10px] text-slate-400 dark:text-zinc-500">
                            {s.name}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          s.hasErrors
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                        }`}>
                          {s.hasErrors ? "Erreurs" : "Valide"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24">
                <svg className="h-8 w-8 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">Analyse en cours...</p>
                {fileName && (
                  <p className="mt-1 text-xs text-slate-400">{fileName}</p>
                )}
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                      Résultats de l&apos;analyse
                    </h2>
                    {fileName && (
                      <p className="mt-0.5 text-xs text-slate-400">{fileName}</p>
                    )}
                  </div>
                  <button
                    onClick={reset}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Nouvelle analyse
                  </button>
                </div>

                {/* Summary */}
                <div className="mb-6 grid grid-cols-4 gap-3">
                  <SummaryCard label="Bulletins" value={result.nombreBulletins} />
                  <SummaryCard label="Pages" value={result.nombrePages} />
                  <SummaryCard label="Valides" value={totalValides} color="emerald" />
                  <SummaryCard label="En erreur" value={totalInvalides} color={totalInvalides > 0 ? "red" : "emerald"} />
                </div>

                {/* Global status banner */}
                {totalInvalides === 0 ? (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Aucune erreur de paramétrage détectée. Tous les bulletins sont conformes.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900/50 dark:bg-red-950/20">
                    <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {totalErreurs} erreur{totalErreurs > 1 ? "s" : ""} de paramétrage détectée{totalErreurs > 1 ? "s" : ""} sur {totalInvalides} bulletin{totalInvalides > 1 ? "s" : ""}.
                      </p>
                      <p className="mt-0.5 text-xs text-red-600/70 dark:text-red-400/60">
                        Les erreurs ci-dessous indiquent des paramètres 2026 mal configurés dans le logiciel de paie.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error type summary (if errors) */}
                {totalErreurs > 0 && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    {Object.entries(
                      result.bulletins.flatMap((b) => b.erreurs).reduce(
                        (acc, e) => {
                          acc[e.type] = (acc[e.type] || 0) + 1;
                          return acc;
                        },
                        {} as Record<string, number>
                      )
                    ).map(([type, count]) => {
                      const info = ERROR_INFO[type];
                      return (
                        <div
                          key={type}
                          className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {type}
                            </span>
                            <span className="text-xs text-slate-400">
                              {count} bulletin{count > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                            {info?.label || type}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                            {info?.description || ""}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bulletin list */}
                <div className="space-y-2">
                  {result.bulletins.map((b, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border bg-white px-4 py-3 dark:bg-zinc-900 ${
                        b.valide
                          ? "border-slate-200 dark:border-zinc-800"
                          : "border-red-200 dark:border-red-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            b.valide ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                          }`}>
                            {b.valide ? (
                              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                              {b.salarie}
                            </span>
                            {b.periode && (
                              <span className="ml-2 text-xs text-slate-400">{b.periode}</span>
                            )}
                          </div>
                        </div>
                        {b.erreurs.length > 0 && (
                          <div className="flex gap-1">
                            {b.erreurs.map((err, j) => (
                              <span
                                key={j}
                                className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                title={err.message}
                              >
                                {err.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-[11px] text-slate-400">
          VeriPay &middot; Vérification de bulletins de paie &middot; Convention CCNT 66
        </div>
      </footer>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorClass =
    color === "emerald"
      ? "text-emerald-600"
      : color === "red"
        ? "text-red-600"
        : "text-slate-900 dark:text-zinc-100";
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        {label}
      </p>
      <p className={`mt-0.5 text-xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function Documentation() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-zinc-100">
        Documentation
      </h2>

      <div className="space-y-6">
        {/* Qu'est-ce que VeriPay */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Qu&apos;est-ce que VeriPay ?
          </h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
            VeriPay est un outil de vérification automatique des bulletins de paie
            français. Il analyse les PDF de bulletins de salaire émis sous la{" "}
            <strong>Convention collective du 15 mars 1966 (CCNT 66)</strong> et
            détecte les erreurs de paramétrage courantes dans les logiciels de paie.
          </p>
        </section>

        {/* Erreurs détectées */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Erreurs détectées
          </h3>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/50">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  TIAFM
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Plafond de Sécurité sociale (PMSS)
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
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
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  SMIC mensuel
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                Détecte une erreur de saisie sur le SMIC mensuel 151,67 h : <strong>1 832,03 €</strong> (erroné)
                au lieu de <strong>1 823,03 €</strong> (correct). Impact sur le calcul de la RGDU.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/50">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  RGDUB
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Coefficient RGDU (T delta)
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                Détecte un coefficient T delta mal paramétré dans le calcul de la Réduction Générale
                des Cotisations (RGDU) : <strong>0,3241</strong> (erroné) au lieu de{" "}
                <strong>0,3821</strong> (correct 2026). La formule RGDU est :{" "}
                <code className="rounded bg-slate-200 px-1 py-0.5 text-[10px] dark:bg-zinc-700">
                  C = T_min + T_delta x [(1/2) x (3 x SMIC / brut - 1)]^P
                </code>
              </p>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Comment fonctionne l&apos;analyse ?
          </h3>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                1
              </span>
              <span><strong>Extraction</strong> : Le texte du PDF est extrait et les bulletins individuels sont identifiés.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                2
              </span>
              <span><strong>Parsing</strong> : Chaque bulletin est parsé en structure JSON (employeur, salarié, cotisations, etc.).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                3
              </span>
              <span><strong>Détection</strong> : Les paramètres (PMSS, SMIC, coeff. RGDU) sont comparés aux valeurs 2026 attendues.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                4
              </span>
              <span><strong>Résultat</strong> : Chaque bulletin reçoit un statut valide/invalide avec les erreurs détaillées.</span>
            </li>
          </ol>
        </section>

        {/* API */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            API Endpoints
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
              <code className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                POST /bulletins/analyser
              </code>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Upload un PDF &rarr; retourne les erreurs de paramétrage par bulletin.
                Body : <code className="text-[10px]">multipart/form-data</code>, champ <code className="text-[10px]">pdf</code>.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
              <code className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                POST /bulletins/upload
              </code>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Upload un PDF &rarr; retourne les bulletins parsés en JSON avec vérification complète.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
              <code className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                POST /bulletins/verifier
              </code>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Vérifie un bulletin JSON déjà extrait. Body : <code className="text-[10px]">{"{ bulletin: {...} }"}</code>.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
              <code className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                GET /bulletins/sante
              </code>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Health check de l&apos;API.
              </p>
            </div>
          </div>
        </section>

        {/* Formats supportés */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Formats de bulletins supportés
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
              <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Bulletin détaillé</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                Chaque cotisation sur une ligne avec code (20000, 20200, etc.), base, taux, et montants salarié/patronal.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/50">
              <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Bulletin clarifié</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                Cotisations regroupées par catégorie (Santé, Retraite, Famille, Chômage, Impôt sur le revenu).
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500">
            Le type est détecté automatiquement. Un PDF peut contenir plusieurs bulletins qui seront analysés individuellement.
          </p>
        </section>
      </div>
    </div>
  );
}
