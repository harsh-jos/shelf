"use client";
import { useState } from "react";
import NewArtifactModal from "./NewArtifactModal";

export default function HeaderActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-[32px] px-4 rounded-full bg-[#0f0f0f] text-white text-[13px] font-[550] tracking-[-0.01em] hover:bg-black transition-colors flex items-center gap-1.5"
      >
        <span className="size-4 rounded-full bg-[#30AFFF] flex items-center justify-center text-[11px] leading-none text-white">+</span>
        New
      </button>
      <NewArtifactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
