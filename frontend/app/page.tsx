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

const ERROR_LABELS: Record<string, string> = {
  TIAFM: "Plafond SS (PMSS)",
  AAICO: "SMIC mensuel",
  RGDUB: "Coefficient RGDU",
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
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

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

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

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const totalErreurs = result
    ? result.bulletins.reduce((s, b) => s + b.erreurs.length, 0)
    : 0;
  const totalValides = result
    ? result.bulletins.filter((b) => b.valide).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-mono text-sm font-bold text-white">
              VP
            </div>
            <h1 className="text-lg font-semibold tracking-tight">VeriPay</h1>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-500">
            Analyse de bulletins de paie
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Upload zone */}
        {!result && (
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                Analyser un bulletin de paie
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Uploadez un PDF pour détecter les erreurs de paramétrage
                (PMSS, SMIC, RGDU)
              </p>
            </div>

            <div
              className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : file
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/10"
                    : "border-slate-300 bg-white hover:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
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
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <svg
                      className="h-6 w-6 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-zinc-100">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(file.size / 1024).toFixed(0)} Ko
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
                    <svg
                      className="h-6 w-6 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="font-medium text-slate-700 dark:text-zinc-300">
                    Glissez un PDF ici
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ou cliquez pour sélectionner
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Analyse en cours...
                </>
              ) : (
                "Analyser le bulletin"
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                  Résultats
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {result.nombreBulletins} bulletin
                  {result.nombreBulletins > 1 ? "s" : ""} analysé
                  {result.nombreBulletins > 1 ? "s" : ""} &middot;{" "}
                  {result.nombrePages} page{result.nombrePages > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={reset}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Nouvelle analyse
              </button>
            </div>

            {/* Summary cards */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  Bulletins
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  {result.nombreBulletins}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  Valides
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {totalValides}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  Erreurs
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${totalErreurs > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {totalErreurs}
                </p>
              </div>
            </div>

            {/* Bulletin details */}
            <div className="space-y-4">
              {result.bulletins.map((b, i) => (
                <div
                  key={i}
                  className={`rounded-xl border bg-white p-6 dark:bg-zinc-900 ${
                    b.valide
                      ? "border-emerald-200 dark:border-emerald-900/50"
                      : "border-red-200 dark:border-red-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-zinc-100">
                        {b.salarie}
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-500">
                        {b.periode}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        b.valide
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${b.valide ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      {b.valide ? "Valide" : `${b.erreurs.length} erreur${b.erreurs.length > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  {b.erreurs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {b.erreurs.map((err, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-3 rounded-lg bg-red-50/70 px-4 py-3 dark:bg-red-950/20"
                        >
                          <span className="mt-0.5 rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400">
                            {err.type}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                              {ERROR_LABELS[err.type] || err.type}
                            </p>
                            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400/80">
                              {err.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-6 py-6 text-center text-xs text-slate-400 dark:text-zinc-600">
          VeriPay &middot; Vérification CCNT 66
        </div>
      </footer>
    </div>
  );
}
