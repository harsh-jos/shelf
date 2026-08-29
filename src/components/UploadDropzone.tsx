"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const pick = () => inputRef.current?.click();

  const onFile = (f: File | null) => {
    if (!f) return;
    const ok = f.name.endsWith(".html") || f.name.endsWith(".htm") || f.name.endsWith(".md") || f.name.endsWith(".pdf");
    if (!ok) {
      setError("Only HTML, MD or PDF allowed");
      return;
    }
    if (f.size > 40 * 1024 * 1024) {
      setError("File too large — 40 MB limit");
      return;
    }
    setFile(f);
    setError(null);
    setSuccess(null);
  };

  const upload = async () => {
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const content = await file.text();
      const type = file.name.endsWith(".md") ? "md" : file.name.endsWith(".pdf") ? "pdf" : "html";
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").slice(0, 80) || "Untitled";
      const r = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, content, description: `${formatBytes(file.size)} • via upload` }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setSuccess({ id: j.id, url: j.url });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e: any) {
      if (e.message?.includes("Not authenticated")) {
        window.location.href = "/login";
        return;
      }
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0] || null;
        onFile(f);
      }}
      className={`mt-6 rounded-[16px] border border-dashed bg-white px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-3 transition-colors ${dragOver ? "border-[#30AFFF] bg-[#eef6ff]" : "border-[var(--border)]"}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="size-8 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center shrink-0">⬆</div>
        <div className="min-w-0">
          <div className="text-[13px] font-[550] truncate">
            {file ? (
              <>
                {file.name} <span className="text-[11px] font-[400] text-[var(--muted-foreground)]">• {formatBytes(file.size)}</span>
              </>
            ) : (
              "Drop an artifact"
            )}
          </div>
          <div className="text-[12px] text-[var(--muted-foreground)] truncate">
            {success ? (
              <span className="text-[#0a7bc2]">Saved! <a href={success.url} className="underline">View {success.id.slice(0, 8)} →</a></span>
            ) : file ? (
              "Ready to upload — HTML, MD or PDF"
            ) : (
              "HTML, MD or PDF — or let Claude call save_artifact()"
            )}
          </div>
          {error && <div className="text-[11px] text-red-600 mt-1">{error}</div>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <input ref={inputRef} type="file" accept=".html,.htm,.md,.pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
        <button onClick={pick} className="h-8 px-4 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[550] hover:bg-[var(--muted)]">
          {file ? "Change" : "Choose file"}
        </button>
        <button onClick={upload} disabled={!file || uploading} className="h-8 px-4 rounded-full bg-[#0f0f0f] text-white text-[12.5px] font-[550] disabled:opacity-40 disabled:cursor-not-allowed">
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}
