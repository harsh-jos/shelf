"use client";
import { useEffect, useState } from "react";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function StorageBar() {
  const [data, setData] = useState<{ used: number; limit: number; unlimited: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/storage")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setData(j))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { used, limit, unlimited } = data;
  // For unlimited (harsh), still show bar relative to 40MB for reference, but never red
  const pct = Math.min(100, (used / (40 * 1024 * 1024)) * 100);
  const nearFull = !unlimited && pct > 85;
  const over = !unlimited && used >= limit;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end min-w-[120px]">
        <div className="text-[11px] font-[500] text-[var(--muted-foreground)] leading-none">
          {unlimited ? (
            <span className="inline-flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded-full bg-[#eef6ff] border border-[#d6ebff] text-[#0a7bc2] text-[10px] font-[700]">UNLIMITED</span>
              {formatBytes(used)} used
            </span>
          ) : (
            <>
              {formatBytes(used)} / 40 MB
            </>
          )}
        </div>
        <div className="mt-1.5 w-[120px] h-1.5 rounded-full bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${unlimited ? "bg-[#30AFFF]" : over ? "bg-red-500" : nearFull ? "bg-amber-500" : "bg-[#30AFFF]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* compact slider for mobile */}
      <div className="sm:hidden w-14 h-1.5 rounded-full bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
        <div className={`h-full rounded-full ${unlimited ? "bg-[#30AFFF]" : "bg-[#30AFFF]"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
