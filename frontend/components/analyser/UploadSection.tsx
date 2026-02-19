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
    <div className="animate-fade-in-up grid gap-10 lg:grid-cols-5">
      {/* Upload zone */}
      <div className="lg:col-span-3">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
          Analyser un bulletin
        </h2>
        <p className="mb-8 text-sm text-muted">
          Uploadez un PDF de bulletin(s) de paie pour detecter les erreurs de parametrage.
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
          <div className="mt-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-2.5 text-xs text-foreground">
            {error}
          </div>
        )}

        <Button
          onClick={onSubmit}
          disabled={!file || loading}
          className="mt-5 w-full"
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
