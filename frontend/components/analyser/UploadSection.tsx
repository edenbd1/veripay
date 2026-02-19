"use client";

import { FileDropZone } from "@/components/ui/FileDropZone";
import { Button } from "@/components/ui/Button";
import { SamplePDFList } from "./SamplePDFList";

interface UploadSectionProps {
  file: File | null;
  dragActive: boolean;
  loading: boolean;
  error: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (f: File) => void;
  onSubmit: () => void;
  onSampleSelect: (name: string) => void;
}

export function UploadSection({
  file,
  dragActive,
  loading,
  error,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onSubmit,
  onSampleSelect,
}: UploadSectionProps) {
  return (
    <div className="animate-fade-in-up grid gap-8 lg:grid-cols-5">
      {/* Upload zone */}
      <div className="lg:col-span-3">
        <h2 className="mb-1 text-xl font-semibold text-foreground">
          Analyser un bulletin
        </h2>
        <p className="mb-6 text-sm text-muted">
          Uploadez un PDF de bulletin(s) de paie pour détecter les erreurs de paramétrage.
        </p>

        <FileDropZone
          file={file}
          dragActive={dragActive}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onFileSelect={onFileSelect}
        />

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Button
          onClick={onSubmit}
          disabled={!file || loading}
          className="mt-4 w-full"
        >
          Analyser le bulletin
        </Button>
      </div>

      {/* Sample PDFs */}
      <div className="lg:col-span-2">
        <SamplePDFList loading={loading} onSelect={onSampleSelect} />
      </div>
    </div>
  );
}
