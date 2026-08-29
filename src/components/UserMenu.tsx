"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StorageBar from "./StorageBar";

export default function UserMenu({ username }: { username: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!username) {
    return (
      <div className="flex items-center gap-1.5">
        <a href="/login" className="h-7 px-3 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[500] inline-flex items-center hover:bg-[var(--muted)]">Sign in</a>
        <a href="/register" className="h-7 px-3 rounded-full bg-[#0f0f0f] text-white text-[12.5px] font-[500] inline-flex items-center">Sign up</a>
      </div>
    );
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.refresh();
    router.push("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-full bg-[#eef6ff] border border-[#d6ebff] text-[#0a7bc2] text-[12.5px] font-[500] hover:bg-[#e4f2ff]"
      >
        <span className="size-4 rounded-full bg-[#30AFFF] flex items-center justify-center text-white text-[10px] leading-none">
          {username[0]?.toUpperCase()}
        </span>
        {username}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[280px] rounded-[16px] bg-white border border-[var(--border)] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-3 z-50">
          <div className="px-2 py-1">
            <div className="text-[11px] font-[600] tracking-[0.06em] uppercase text-[var(--muted-foreground)]">Signed in as</div>
            <div className="text-[13px] font-[600]">{username}</div>
          </div>
          <div className="mt-2 rounded-[12px] bg-[var(--muted)] border border-[var(--border)] p-3">
            <div className="text-[11px] font-[600] tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-2">Storage</div>
            <StorageBar />
          </div>
          <button onClick={logout} className="mt-2 w-full h-8 rounded-full bg-white border border-[var(--border)] text-[13px] font-[500] hover:bg-[var(--muted)]">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
