"use client";

import { useAnalysis } from "@/hooks/useAnalysis";
import { UploadSection } from "@/components/analyser/UploadSection";
import { AnalysisLoading } from "@/components/analyser/AnalysisLoading";
import { ResultsView } from "@/components/analyser/ResultsView";

export default function AnalyserPage() {
  const {
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
  } = useAnalysis();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {!result && !loading && (
        <UploadSection
          file={file}
          dragActive={dragActive}
          loading={loading}
          error={error}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onFileSelect={handleFile}
          onSubmit={handleSubmit}
          onSampleSelect={handleSample}
        />
      )}

      {loading && <AnalysisLoading fileName={fileName} />}

      {result && !loading && (
        <ResultsView
          result={result}
          fileName={fileName}
          totalErreurs={totalErreurs}
          totalValides={totalValides}
          totalInvalides={totalInvalides}
          onReset={reset}
        />
      )}
    </div>
  );
}
