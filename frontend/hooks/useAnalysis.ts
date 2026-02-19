"use client";

import { useState, useCallback } from "react";
import { API_URL } from "@/lib/constants";
import type { ResultatAnalyse } from "@/lib/types";

export function useAnalysis() {
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
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
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

  return {
    file,
    fileName,
    loading,
    result,
    error,
    dragActive,
    setDragActive,
    handleFile,
    handleDrop,
    handleSubmit,
    handleSample,
    reset,
    totalErreurs,
    totalValides,
    totalInvalides,
  };
}
