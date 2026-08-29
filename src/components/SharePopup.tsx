"use client";
import { useState } from "react";

export default function SharePopup({ id, isPublic, onClose, onMadePublic }: { id: string; isPublic: boolean; onClose: () => void; onMadePublic: () => void }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowPublic, setNowPublic] = useState(isPublic);
  const url = typeof window !== "undefined" ? `${window.location.origin}/a/${id}` : `/a/${id}`;

  const makePublic = async () => {
    setBusy(true);
    const r = await fetch(`/api/artifacts/${id}/share`, { method: "POST" });
    setBusy(false);
    if (r.ok) {
      setNowPublic(true);
      onMadePublic();
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] rounded-[16px] bg-white border border-[var(--border)] shadow-[0_16px_48px_rgba(0,0,0,0.16)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="size-8 rounded-full bg-[#eef6ff] border border-[#d6ebff] flex items-center justify-center text-[#0a7bc2]">↗</div>
          <button onClick={onClose} className="size-7 rounded-full bg-[#f6f5f3] border border-[var(--border)] flex items-center justify-center text-[13px]">✕</button>
        </div>
        {!nowPublic ? (
          <>
            <h3 className="mt-3 text-[16px] font-[650] tracking-[-0.01em]">Make this artifact public?</h3>
            <p className="mt-1 text-[13px] leading-[1.5] text-[var(--muted-foreground)]">It’s currently private — only you can see it. Making it public gives anyone with the UUID link access. The link is practically safe to share.</p>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={onClose} className="h-8 px-4 rounded-full bg-white border border-[var(--border)] text-[13px] font-[500]">Cancel</button>
              <button onClick={makePublic} disabled={busy} className="h-8 px-4 rounded-full bg-[#30AFFF] text-white text-[13px] font-[550] disabled:opacity-60">{busy ? "…" : "Make public & get link"}</button>
            </div>
          </>
        ) : (
          <>
            <h3 className="mt-3 text-[16px] font-[650] tracking-[-0.01em]">Link ready</h3>
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">This artifact is now public. Anyone with the link can view it.</p>
            <div className="mt-4 flex items-center gap-2 p-2 rounded-[12px] bg-[#f6f5f3] border border-[var(--border)]">
              <div className="flex-1 min-w-0 text-[12.5px] font-[450] truncate px-2">{url}</div>
              <button onClick={copy} className="shrink-0 h-7 px-3 rounded-full bg-[#0f0f0f] text-white text-[12px] font-[550]">{copied ? "Copied!" : "Copy"}</button>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={onClose} className="h-8 px-4 rounded-full bg-white border border-[var(--border)] text-[13px] font-[500]">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
