import { getArtifact, getCollection } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArtifactViewer from "@/components/ArtifactViewer";
import { getCurrentUser } from "@/lib/auth";

function mdToHtml(md: string) {
  let html = md
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><h/g, "<h").replace(/<\/h([1-3])><\/p>/g, "</h$1>");
  html = html.replace(/<p><blockquote>/g, "<blockquote>").replace(/<\/blockquote><\/p>/g, "</blockquote>");
  html = html.replace(/<p><pre>/g, "<pre>").replace(/<\/pre><\/p>/g, "</pre>");
  html = html.replace(/<p><li>/g, "<li>").replace(/<\/li><\/p>/g, "</li>");
  return html;
}

export default async function ArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact) return notFound();
  const user = await getCurrentUser();
  const isOwner = !!user && user.id === artifact.ownerId;
  // Private artifacts are only visible to owner; public are open to anyone with the uuid link
  if (!artifact.isPublic && !isOwner) {
    // Show a soft gate instead of 404 so the user understands why
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6 bg-[#fcfcfa]">
        <div className="w-full max-w-[440px] rounded-[16px] bg-white border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-6 text-center">
          <div className="size-9 rounded-full bg-[#eef6ff] border border-[#d6ebff] flex items-center justify-center mx-auto text-[#0a7bc2]">🔒</div>
          <h1 className="mt-3 text-[16px] font-[650]">This artifact is private</h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">Only the owner can view it. Sign in as the owner or ask for a public link.</p>
          <div className="mt-4 flex gap-2 justify-center">
            <Link href="/login" className="h-8 px-4 rounded-full bg-[#0f0f0f] text-white text-[13px] font-[550] inline-flex items-center">Sign in</Link>
            <Link href="/" className="h-8 px-4 rounded-full bg-white border border-[var(--border)] text-[13px] font-[500] inline-flex items-center">Library</Link>
          </div>
        </div>
      </main>
    );
  }
  const collection = artifact.collectionId ? await getCollection(artifact.collectionId) : null;
  const isHtml = artifact.type === "html";
  const isMd = artifact.type === "md";

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col bg-[#fcfcfa]">
      <div className="border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="max-w-[1160px] mx-auto px-6 py-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[12.5px] font-[500] px-3 py-1.5 rounded-full bg-[var(--muted)] border border-[var(--border)] hover:bg-white transition-colors">← Library</Link>
            {collection ? (
              <Link href={`/c/${collection.id}`} className="hidden sm:inline-flex text-[12px] font-[500] px-3 py-1.5 rounded-full bg-white border border-[var(--border)]">{collection.title}</Link>
            ) : (
              <span className="hidden sm:inline-flex text-[11px] font-[600] tracking-wide px-2.5 py-1 rounded-full bg-[#eef6ff] border border-[#d6ebff] text-[#0a7bc2]">Loose</span>
            )}
            <span className={`hidden sm:inline-flex text-[10px] font-[700] tracking-wide px-2 py-1 rounded-full border ${artifact.isPublic ? "bg-[#e6f7ed] border-[#b7e5c8] text-[#0a7a3a]" : "bg-[#fff7cc] border-[#ffe9a8] text-[#7a5a00]"}`}>{artifact.isPublic ? "Public" : "Private"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-[700] tracking-wide px-2 py-1 rounded-full border ${isHtml ? "bg-[#eef6ff] border-[#d6ebff] text-[#0a7bc2]" : isMd ? "bg-white border-[var(--border)] text-[var(--muted-foreground)]" : "bg-[#0f0f0f] text-white"}`}>{artifact.type.toUpperCase()}</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">{artifact.createdAt}</span>
          </div>
        </div>
        <div className="max-w-[1160px] mx-auto px-6 pb-4">
          <h1 className="text-[26px] font-[650] tracking-[-0.025em] leading-none">{artifact.title}</h1>
          <p className="text-[13.5px] text-[var(--muted-foreground)] mt-1.5 max-w-[60ch] leading-[1.5]">{artifact.description}</p>
        </div>
      </div>

      <div className="flex-1 p-0 md:p-6">
        {isHtml ? (
          <ArtifactViewer id={artifact.id} title={artifact.title} srcDoc={artifact.content} sandbox="allow-scripts allow-same-origin" initialIsPublic={artifact.isPublic} isOwner={isOwner} />
        ) : isMd ? (
          <ArtifactViewer
            id={artifact.id}
            title={artifact.title}
            sandbox="allow-scripts"
            initialIsPublic={artifact.isPublic}
            isOwner={isOwner}
            srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,system-ui,-apple-system,Helvetica,Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px 24px;line-height:1.7;color:#111} h1{font-family:Inter,system-ui,sans-serif;font-size:30px;letter-spacing:-0.02em;margin:8px 0 16px;font-weight:700} h2{font-size:18px;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #e8e8e6;font-weight:600} h3{font-size:15px;margin:20px 0 8px;font-weight:600} p{margin:14px 0;font-size:15px} blockquote{border-left:3px solid #30AFFF;background:#eef6ff;padding:12px 16px;margin:20px 0;border-radius:8px} code{background:#f6f5f3;border:1px solid #eceae6;padding:2px 5px;font-family:ui-monospace,monospace;font-size:13px;border-radius:6px} pre{background:#0f0f0f;color:#fff;padding:16px;overflow:auto;border-radius:10px} pre code{background:none;border:none;color:inherit} li{margin:6px 0}</style></head><body>${mdToHtml(artifact.content)}</body></html>`}
          />
        ) : (
          <div className="max-w-[920px] mx-auto md:rounded-[16px] overflow-hidden bg-white md:border md:border-[var(--border)] md:shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 text-center">
            <div className="inline-flex px-4 py-3 rounded-[12px] bg-[var(--muted)] border border-[var(--border)] text-[13px]">PDF viewer — will stream from blob storage</div>
          </div>
        )}
      </div>
    </main>
  );
}
