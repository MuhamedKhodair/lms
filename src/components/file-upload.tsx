"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  onUpload: (url: string) => void;
  disabled?: boolean;
}

export function FileUpload({ onUpload, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setProgress("File exceeds 10 MB limit");
      return;
    }
    setUploading(true);
    setProgress("Uploading...");

    const formData = new FormData();
    formData.set("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      onUpload(data.url);
      setProgress(`✓ ${file.name}`);
    } catch (err) {
      setProgress(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm font-medium text-text-muted hover:text-text hover:border-primary/40 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        )}
        {uploading ? "Uploading..." : "Choose file to upload"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*,video/mp4,.docx,.pptx,.zip,.txt"
        onChange={handleChange}
        className="hidden"
      />
      {progress && (
        <p className={`text-xs ${progress.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" : "text-text-muted"}`}>
          {progress}
        </p>
      )}
    </div>
  );
}
