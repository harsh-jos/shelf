import { getCollection, getArtifactsByCollection } from "@/lib/data";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) return notFound();
  const user = await getCurrentUser();
  // Drive-style: collections are private to owner
  if (!user || collection.ownerId !== user.id) return notFound();
  const items = await getArtifactsByCollection(id, user.id);

  return (
    <main className="max-w-[1160px] mx-auto px-6 py-8">
      <a href="/" className="inline-flex items-center gap-1.5 text-[12.5px] font-[500] px-3 py-1.5 rounded-full bg-white border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
        ← Library
      </a>

      <div className="mt-5 rounded-[20px] bg-white border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 md:p-7 flex flex-col md:flex-row gap-6 justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-[600] tracking-[0.06em] uppercase text-[var(--muted-foreground)]">
            <span className="size-2 rounded-full bg-[#30AFFF]" /> Collection
          </div>
          <h1 className="mt-2 text-[30px] font-[650] tracking-[-0.025em] leading-none">{collection.title}</h1>
          <p className="mt-2 text-[13.5px] text-[var(--muted-foreground)] max-w-[50ch] leading-[1.6]">{collection.description}</p>
        </div>
        <div className="rounded-[14px] bg-[var(--muted)] border border-[var(--border)] p-4 h-fit min-w-[180px]">
          <div className="text-[11px] font-[600] tracking-[0.06em] uppercase text-[var(--muted-foreground)]">{items.length} artifacts</div>
          <div className="mt-2 flex gap-1">
            <span className="flex-1 h-1.5 rounded-full bg-[#30AFFF]" />
            <span className="flex-1 h-1.5 rounded-full bg-[#0f0f0f]" />
            <span className="flex-1 h-1.5 rounded-full bg-[var(--border)]" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((a) => (
          <a
            key={a.id}
            href={`/a/${a.id}`}
            className="rounded-[16px] bg-white border border-[var(--border)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#e0ddd8] transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-[650] tracking-wide px-2 py-1 rounded-full border ${a.type === "html" ? "bg-[#eef6ff] border-[#d6ebff] text-[#0a7bc2]" : a.type === "md" ? "bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]" : "bg-[#0f0f0f] text-white border-black"}`}>
                {a.type.toUpperCase()}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">{a.createdAt}</span>
            </div>
            <div className="text-[15px] font-[600] tracking-[-0.01em] mt-3 group-hover:text-[#0a7bc2] transition-colors">{a.title}</div>
            <div className="text-[13px] text-[var(--muted-foreground)] mt-1 leading-[1.5]">{a.description}</div>
            <div className="mt-4 text-[12px] font-[500] text-[#0a7bc2]">View artifact →</div>
          </a>
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-6 rounded-[16px] border border-dashed border-[var(--border)] bg-white p-8 text-center text-[13px] text-[var(--muted-foreground)]">
          No artifacts yet. Drop one or call save_artifact().
        </div>
      )}
    </main>
  );
}
