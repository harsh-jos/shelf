import { getCurrentUser } from "@/lib/auth";
import { getArtifactsForUser, getCollectionsForUser, getStorageUsage } from "@/lib/data";

export default async function Home() {
  const user = await getCurrentUser();
  const visible = user ? await getArtifactsForUser(user.id) : [];
  const myCollections = user ? await getCollectionsForUser(user.id) : [];
  const loose = visible.filter((a) => a.collectionId === null);
  const recent = [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const storage = user ? await getStorageUsage(user.id) : null;

  return (
    <main className="max-w-[1160px] mx-auto px-6 py-8">
      {/* Hero — centered */}
      <div className="flex flex-col items-center text-center py-10 md:py-14">
        <h1 className="text-[42px] md:text-[48px] font-[650] tracking-[-0.035em] leading-[0.95]">A quiet shelf for<br />beautiful <span className="text-[#30AFFF]">artifacts.</span></h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-[var(--muted-foreground)] max-w-[48ch]">
          HTML explainers, markdown essays and PDFs — saved from Claude and Codex via API or MCP, read here without clutter. The artifact is the star.
        </p>
      </div>

      {storage && (
        <div className="rounded-[16px] bg-white border border-[var(--border)] p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-[600]">Storage</span>
              {storage.unlimited ? (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#eef6ff] border border-[#d6ebff] text-[#0a7bc2] font-[700]">UNLIMITED</span>
              ) : (
                <span className="text-[11px] text-[var(--muted-foreground)]">40 MB limit</span>
              )}
              <span className="ml-auto text-[12px] font-[500] text-[var(--muted-foreground)]">
                {(storage.used / (1024 * 1024)).toFixed(2)} MB {storage.unlimited ? "used" : `/ 40 MB`}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${storage.unlimited ? "bg-[#30AFFF]" : storage.used / (40 * 1024 * 1024) > 0.85 ? "bg-amber-500" : "bg-[#30AFFF]"}`}
                style={{ width: `${Math.min(100, (storage.used / (40 * 1024 * 1024)) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
              {storage.unlimited ? "You have no limit — harsh" : `${visible.length} artifacts • ${(storage.used / 1024).toFixed(1)} KB total`}
            </div>
          </div>
          <div className="hidden sm:block text-[11px] text-[var(--muted-foreground)] text-right">
            <div>Each artifact counts</div>
            <div>toward your 40 MB</div>
          </div>
        </div>
      )}

      {/* Collections — only yours, like My Drive folders */}
      <section id="collections" className="mt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] font-[600] tracking-[0.06em] uppercase text-[var(--muted-foreground)]">My collections</h2>
          <span className="text-[12px] text-[var(--muted-foreground)]">{myCollections.length} folders</span>
        </div>
        {!user && (
          <div className="mt-3 rounded-[16px] border border-dashed border-[var(--border)] bg-white p-6 text-center text-[13px] text-[var(--muted-foreground)]">
            <a href="/login" className="text-[#0a7bc2] font-[500]">Sign in</a> to see your Shelf. Public links won’t appear here until you <span className="font-[500]">Save to my Shelf</span>.
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {myCollections.map((c) => {
            const count = visible.filter((a) => a.collectionId === c.id).length;
            return (
              <a
                key={c.id}
                href={`/c/${c.id}`}
                className="group rounded-[16px] bg-white border border-[var(--border)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#e0ddd8] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="size-2.5 rounded-full bg-[#30AFFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[11px] font-[500] px-2 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)]">{count} artifacts</span>
                </div>
                <h3 className="mt-3 text-[16px] font-[600] tracking-[-0.015em]">{c.title}</h3>
                <p className="mt-1 text-[13px] leading-[1.5] text-[var(--muted-foreground)] line-clamp-2">{c.description}</p>
                <div className="mt-4 flex items-center gap-1 text-[12px] font-[500] text-[#0f0f0f] opacity-60 group-hover:opacity-100">Open <span className="group-hover:translate-x-0.5 transition-transform">→</span></div>
              </a>
            );
          })}
          <button onClick={() => alert("New collection — coming soon. For now collections are created via MCP create_collection or API.")} className="rounded-[16px] border border-dashed border-[var(--border)] bg-white/60 p-5 flex flex-col items-center justify-center min-h-[148px] hover:bg-white hover:border-[#d8d5d0] transition-colors w-full text-left">
            <span className="size-7 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[16px] leading-none">+</span>
            <span className="mt-2 text-[12px] font-[550]">New collection</span>
            <span className="text-[12px] text-[var(--muted-foreground)]">Organize your next topic</span>
          </button>
        </div>
      </section>

      {/* Recent + Loose */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.7fr_0.95fr] gap-5">
        <section className="rounded-[20px] bg-white border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50">
            <h2 className="text-[13px] font-[600] tracking-[-0.01em]">Recent</h2>
            <span className="text-[11px] font-[500] px-2 py-1 rounded-full bg-white border border-[var(--border)] text-[var(--muted-foreground)]">Newest first</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">
                {user ? "Your Shelf is empty. Save a public artifact or upload one." : "Sign in to see your Shelf. Public links are link-only."}
              </div>
            ) : (
              recent.map((a) => (
                <a key={a.id} href={`/a/${a.id}`} className="flex gap-3.5 p-4 hover:bg-[var(--muted)]/50 transition-colors group">
                  <div className={`shrink-0 size-9 rounded-[10px] border flex items-center justify-center text-[10px] font-[650] tracking-wide ${a.type === "html" ? "bg-[#eef6ff] border-[#d6ebff] text-[#0a7bc2]" : a.type === "md" ? "bg-[#f6f5f3] border-[var(--border)] text-[#0f0f0f]" : "bg-[#0f0f0f] text-white border-black"}`}>
                    {a.type.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-[550] tracking-[-0.01em] leading-none group-hover:text-[#0a7bc2] transition-colors">{a.title}</div>
                    <div className="text-[12.5px] text-[var(--muted-foreground)] mt-1 line-clamp-1">{a.description}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)]">{a.collectionId ?? "loose"}</span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">{a.createdAt}</span>
                    </div>
                  </div>
                  <span className="hidden sm:flex size-7 rounded-full bg-white border border-[var(--border)] items-center justify-center text-[12px] group-hover:border-[#d6ebff] group-hover:bg-[#eef6ff] transition-colors">↗</span>
                </a>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[20px] bg-[#fcfcfa] border border-[var(--border)] p-5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-white border border-[var(--border)] flex items-center justify-center">
              <div className="size-2 rounded-full bg-[#30AFFF]" />
            </div>
            <h2 className="text-[13px] font-[600]">Loose artifacts</h2>
            <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-white border border-[var(--border)] text-[var(--muted-foreground)]">{loose.length}</span>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-[var(--muted-foreground)]">Essays that don&apos;t need a folder — yet.</p>
          <div className="mt-4 space-y-3">
            {loose.map((a) => (
              <a key={a.id} href={`/a/${a.id}`} className="block rounded-[14px] bg-white border border-[var(--border)] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:border-[#e0ddd8] transition-all">
                <div className="text-[13px] font-[550] leading-none tracking-[-0.01em]">{a.title}</div>
                <div className="text-[12px] text-[var(--muted-foreground)] mt-1.5 line-clamp-2 leading-[1.5]">{a.description}</div>
                <div className="mt-2 text-[11px] font-[500] text-[#0a7bc2]">Open →</div>
              </a>
            ))}
          </div>
          <div className="mt-4 rounded-[12px] bg-white border border-[var(--border)] px-3 py-2.5 text-[11.5px] leading-[1.5] text-[var(--muted-foreground)]">
            Tip: artifacts can live loose forever. Group them only when a theme emerges.
          </div>
        </section>
      </div>

      {/* Drop */}
      <div className="mt-6 rounded-[16px] border border-dashed border-[var(--border)] bg-white px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center">⬆</div>
          <div>
            <div className="text-[13px] font-[550]">Drop an artifact</div>
            <div className="text-[12px] text-[var(--muted-foreground)]">HTML, MD or PDF — or let Claude call save_artifact()</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-8 px-4 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[550] hover:bg-[var(--muted)]">Choose file</button>
          <button className="h-8 px-4 rounded-full bg-[#0f0f0f] text-white text-[12.5px] font-[550]">Upload</button>
        </div>
      </div>
    </main>
  );
}
