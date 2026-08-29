"use client";

export default function NewCollectionButton() {
  return (
    <button
      onClick={() => alert("New collection — coming soon. For now collections are created via MCP create_collection or API.")}
      className="rounded-[16px] border border-dashed border-[var(--border)] bg-white/60 p-5 flex flex-col items-center justify-center min-h-[148px] hover:bg-white hover:border-[#d8d5d0] transition-colors w-full text-left"
    >
      <span className="size-7 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[16px] leading-none">+</span>
      <span className="mt-2 text-[12px] font-[550]">New collection</span>
      <span className="text-[12px] text-[var(--muted-foreground)]">Organize your next topic</span>
    </button>
  );
}
