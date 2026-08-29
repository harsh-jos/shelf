"use client";
import { useState } from "react";

export default function NewArtifactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!open) return null;

  const shelfUrl = typeof window !== "undefined" ? window.location.origin : "https://shelf.vercel.app";
  const mcpUrl = `${shelfUrl}/api/mcp`;
  const configSnippet = `{
  "mcpServers": {
    "shelf": {
      "command": "npx",
      "args": ["mcp-remote", "${mcpUrl}", "--header", "Authorization: Bearer <shelf_token>"],
      "env": {}
    }
  }
}`;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[560px] rounded-[20px] bg-white border border-[var(--border)] shadow-[0_24px_64px_rgba(0,0,0,0.18)] flex flex-col max-h-[85vh] overflow-hidden">
        <div className="shrink-0 px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-[650] tracking-[-0.01em]">Add to Shelf</h3>
            <p className="text-[12.5px] text-[var(--muted-foreground)]">Save beautiful artifacts via MCP — or upload manually</p>
          </div>
          <button onClick={onClose} className="size-7 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[13px]">✕</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 overscroll-contain">
          <div className="rounded-[14px] bg-[#fcfcfa] border border-[var(--border)] p-4">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-[#30AFFF] text-white flex items-center justify-center text-[12px]">1</span>
              <span className="text-[13px] font-[600]">Hosted MCP (recommended)</span>
              <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[#eef6ff] border border-[#d6ebff] text-[#0a7bc2] font-[600]">2-4s cold start</span>
            </div>
            <p className="mt-2 text-[12.5px] leading-[1.5] text-[var(--muted-foreground)]">
              Claude wakes the serverless MCP when it fetches the tool catalog. No separate deploy — same Vercel app at <code className="px-1 py-0.5 rounded bg-white border border-[var(--border)] text-[11px]">{mcpUrl}</code>
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-[600] tracking-[0.06em] uppercase text-[var(--muted-foreground)]">Claude Code config</span>
                <button onClick={() => copy(configSnippet, "config")} className="text-[11px] font-[500] px-2 py-1 rounded-full bg-white border border-[var(--border)] hover:bg-[var(--muted)]">{copied === "config" ? "Copied!" : "Copy"}</button>
              </div>
              <pre className="mt-2 p-3 rounded-[10px] bg-[#0f0f0f] text-[#e8e8e8] text-[11px] leading-[1.5] overflow-auto">{configSnippet}</pre>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => copy(mcpUrl, "url")} className="h-7 px-3 rounded-full bg-white border border-[var(--border)] text-[11px] font-[500] hover:bg-[var(--muted)]">{copied === "url" ? "Copied!" : "Copy MCP URL"}</button>
              <a href="/api/mcp" target="_blank" className="h-7 px-3 rounded-full bg-[#0f0f0f] text-white text-[11px] font-[500] inline-flex items-center">Test GET /api/mcp</a>
            </div>
            <div className="mt-3 text-[11px] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-3">
              Get token: <code className="px-1 py-0.5 rounded bg-white border text-[11px]">POST /api/auth/login</code> → <code className="px-1 py-0.5 rounded bg-white border text-[11px]">shelf_token</code> cookie → use as <code className="px-1 py-0.5 rounded bg-white border text-[11px]">Bearer</code>. Tools: <code className="px-1 py-0.5 rounded bg-white border text-[11px]">save_artifact</code>, <code className="px-1 py-0.5 rounded bg-white border text-[11px]">list_artifacts</code>, <code className="px-1 py-0.5 rounded bg-white border text-[11px]">get_artifact</code>
            </div>
          </div>

          <div className="rounded-[14px] bg-white border border-[var(--border)] p-4">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[12px]">2</span>
              <span className="text-[13px] font-[600]">Manual upload (why some buttons seemed dead)</span>
            </div>
            <p className="mt-2 text-[12.5px] text-[var(--muted-foreground)]">Drop zone and “New collection” were placeholders. Use the API directly until wired:</p>
            <pre className="mt-2 p-3 rounded-[10px] bg-[#f6f5f3] border border-[var(--border)] text-[11px] overflow-auto">{`curl -X POST ${shelfUrl}/api/artifacts \\
  -H "Content-Type: application/json" \\
  -H "Cookie: shelf_token=<jwt>" \\
  -d '{"title":"My artifact","type":"html","content":"<h1>hi</h1>","description":"..."}'`}</pre>
            <button onClick={() => copy(`curl -X POST ${mcpUrl.replace("/api/mcp","/api/artifacts")} -H 'Content-Type: application/json' -H 'Cookie: shelf_token=<jwt>' -d '{"title":"My artifact","type":"html","content":"<h1>hi</h1>"}'`, "curl")} className="mt-2 h-7 px-3 rounded-full bg-white border border-[var(--border)] text-[11px] font-[500] hover:bg-[var(--muted)]">{copied === "curl" ? "Copied!" : "Copy curl"}</button>
          </div>
        </div>

        <div className="shrink-0 px-6 py-3 border-t border-[var(--border)] bg-[var(--muted)]/50 flex justify-end">
          <button onClick={onClose} className="h-8 px-4 rounded-full bg-[#0f0f0f] text-white text-[13px] font-[500]">Got it</button>
        </div>
      </div>
    </div>
  );
}
