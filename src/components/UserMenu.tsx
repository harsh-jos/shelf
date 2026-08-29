"use client";
import { useRouter } from "next/navigation";

export default function UserMenu({ username }: { username: string | null }) {
  const router = useRouter();
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
    router.refresh();
    router.push("/login");
  };
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-[12.5px] font-[500] px-2.5 py-1 rounded-full bg-[#eef6ff] border border-[#d6ebff] text-[#0a7bc2]">{username}</span>
      <button onClick={logout} className="h-7 px-3 rounded-full bg-white border border-[var(--border)] text-[12.5px] font-[500] hover:bg-[var(--muted)]">Logout</button>
    </div>
  );
}
