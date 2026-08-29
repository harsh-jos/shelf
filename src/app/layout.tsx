import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";

export const metadata: Metadata = {
  title: "Shelf — a home for things you learn",
  description: "Beautiful home for HTML, Markdown and PDF artifacts. Collections, loose artifacts, and a pure viewer.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[rgba(252,252,250,0.8)] border-b border-[var(--border)]">
          <div className="max-w-[1160px] mx-auto px-6 h-[56px] flex items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-3 shrink-0">
              <div className="size-[28px] rounded-[8px] bg-[#0f0f0f] flex items-center justify-center">
                <div className="size-[14px] rounded-[4px] bg-[#30AFFF]" />
              </div>
              <span className="text-[17px] font-[600] tracking-[-0.02em]">Shelf</span>
              <span className="hidden lg:inline text-[12.5px] text-[var(--muted-foreground)] ml-1 font-[450]">A home for things you learn</span>
            </a>

            <div className="hidden md:flex items-center gap-2 flex-1 max-w-[480px] mx-6">
              <div className="flex-1 flex items-center gap-2 h-[34px] px-3 rounded-full bg-white border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]"><path d="M11.5 11.5L14 14M13 7.5A5.5 5.5 0 1 1 2 7.5a5.5 5.5 0 0 1 11 0Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <input placeholder="Search artifacts, collections…" className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--muted-foreground)]" />
                <span className="hidden lg:inline text-[11px] px-1.5 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)]">⌘K</span>
              </div>
            </div>

            <nav className="flex items-center gap-2 shrink-0">
              <a href="/" className="hidden sm:inline text-[13px] font-[500] px-3 py-1.5 rounded-full hover:bg-[var(--muted)] transition-colors">Library</a>
              <button className="h-[32px] px-4 rounded-full bg-[#0f0f0f] text-white text-[13px] font-[550] tracking-[-0.01em] hover:bg-black transition-colors flex items-center gap-1.5">
                <span className="size-4 rounded-full bg-[#30AFFF] flex items-center justify-center text-[11px] leading-none text-white">+</span>
                New
              </button>
              <UserMenu username={user?.username ?? null} />
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
