"use client";

import { cn } from "@/lib/cn";

interface FileDropZoneProps {
  file: File | null;
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (f: File) => void;
}

export function FileDropZone({
  file,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: FileDropZoneProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200",
        dragActive
          ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/10"
          : file
            ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/5"
            : "border-border bg-surface hover:border-border-hover hover:shadow-sm"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept=".pdf"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
        }}
      />
      {file ? (
        <>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="mt-1 text-xs text-muted">{(file.size / 1024).toFixed(0)} Ko</p>
        </>
      ) : (
        <>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
            <svg className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">Glissez un PDF ici</p>
          <p className="mt-1 text-xs text-muted">ou cliquez pour sélectionner (max 10 Mo)</p>
        </>
      )}
    </div>
  );
}
