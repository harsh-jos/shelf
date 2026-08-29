"use client";

import { useEffect, useState, useCallback } from "react";
import SharePopup from "./SharePopup";

type Props = {
  id: string;
  title: string;
  srcDoc: string;
  sandbox?: string;
  initialIsPublic?: boolean;
  isOwner?: boolean;
};

export default function ArtifactViewer({ id, title, srcDoc, sandbox = "allow-scripts allow-same-origin", initialIsPublic = false, isOwner = false }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "exists">("idle");
  const [savedId, setSavedId] = useState<string | null>(null);

  const exit = useCallback(() => setIsFullscreen(false), []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isFullscreen, exit]);

  const handleSave = async () => {
    setSaveState("saving");
    const r = await fetch(`/api/artifacts/${id}/save`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (r.ok) {
      setSavedId(j.artifactId);
      setSaveState(j.alreadySaved ? "exists" : "saved");
    } else {
      setSaveState("idle");
      alert(j.error || "Could not save");
    }
  };

  return (
    <>
      {/* Preview container */}
      <div className="max-w-[920px] mx-auto md:rounded-[16px] overflow-hidden bg-white md:border md:border-[var(--border)] md:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="h-[36px] px-3 flex items-center justify-between bg-[#f6f5f3] border-b border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f56] border border-black/10" />
            <span className="size-3 rounded-full bg-[#ffbd2e] border border-black/10" />
            <span className="size-3 rounded-full bg-[#27c93f] border border-black/10" />
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-[500] text-[var(--muted-foreground)]">
            <span className="size-1.5 rounded-full bg-[#30AFFF] shadow-[0_0_6px_rgba(48,175,255,0.6)]" /> rendered as-is
          </span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="h-6 px-2.5 rounded-full bg-white border border-[var(--border)] text-[11px] font-[550] hover:bg-[#0f0f0f] hover:text-white hover:border-[#0f0f0f] transition-colors inline-flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8H3.01M3 3H8M8 3V8M13 8H13.01M13 13H8M8 13V8M3 13H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Full screen
          </button>
        </div>
        <iframe title={title} srcDoc={srcDoc} sandbox={sandbox} className="w-full h-[58vh] md:h-[62vh] border-0 bg-white block" />
      </div>

      <div className="max-w-[920px] mx-auto mt-3 flex gap-2 justify-end flex-wrap">
        {isOwner ? (
          <>
            <button onClick={() => setShowShare(true)} className="h-8 px-3 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[500] hover:bg-[var(--muted)]">Share link</button>
            <button onClick={() => {
              const blob = new Blob([srcDoc], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.html`; a.click();
              URL.revokeObjectURL(url);
            }} className="h-8 px-3 rounded-full bg-[#0f0f0f] text-white text-[12.5px] font-[550]">Download</button>
          </>
        ) : (
          <>
            {isPublic ? (
              <>
                {saveState === "saved" || saveState === "exists" ? (
                  <a href={savedId ? `/a/${savedId}` : "#"} className="h-8 px-4 rounded-full bg-[#30AFFF] text-white text-[12.5px] font-[550] inline-flex items-center gap-1.5">
                    {saveState === "exists" ? "Already in your Shelf — view" : "Saved! View in Shelf"} →
                  </a>
                ) : (
                  <button onClick={handleSave} disabled={saveState === "saving"} className="h-8 px-4 rounded-full bg-[#30AFFF] text-white text-[12.5px] font-[550] hover:bg-[#0096e6] disabled:opacity-60 inline-flex items-center gap-1.5">
                    <span className="size-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">+</span>
                    {saveState === "saving" ? "Saving…" : "Save to my Shelf"}
                  </button>
                )}
                <button onClick={() => {
                  const blob = new Blob([srcDoc], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.html`; a.click();
                  URL.revokeObjectURL(url);
                }} className="h-8 px-3 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[500]">Download</button>
              </>
            ) : (
              <button className="h-8 px-3 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[500]" disabled>Private</button>
            )}
          </>
        )}
      </div>

      {showShare && (
        <SharePopup id={id} isPublic={isPublic} onClose={() => setShowShare(false)} onMadePublic={() => setIsPublic(true)} />
      )}

      {/* Fullscreen overlay — platform gets out of the way */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="h-10 px-4 flex items-center justify-between border-b border-[var(--border)] bg-white/90 backdrop-blur shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={exit}
                className="h-7 px-3 rounded-full bg-[#f6f5f3] border border-[var(--border)] text-[12.5px] font-[550] inline-flex items-center gap-1.5 hover:bg-white"
              >
                ← Back to preview
              </button>
              <span className="hidden sm:inline text-[12.5px] font-[500] truncate max-w-[40ch] text-[var(--muted-foreground)]">{title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] text-[var(--muted-foreground)]">Esc to exit</span>
              <button onClick={exit} className="size-7 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-[12px]">✕</button>
            </div>
          </div>
          <iframe title={title} srcDoc={srcDoc} sandbox={sandbox} className="flex-1 w-full border-0 bg-white block" />
        </div>
      )}
    </>
  );
}
