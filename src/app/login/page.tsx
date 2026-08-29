"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) setErr(j.error || "Failed");
    else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="max-w-[420px] mx-auto px-6 py-16">
      <div className="rounded-[20px] bg-white border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-7">
        <div className="size-8 rounded-[10px] bg-[#0f0f0f] flex items-center justify-center"><div className="size-3.5 rounded-[5px] bg-[#30AFFF]" /></div>
        <h1 className="mt-3 text-[22px] font-[650] tracking-[-0.02em]">Welcome back</h1>
        <p className="text-[13px] text-[var(--muted-foreground)] mt-1">Sign in to your Shelf</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full h-9 px-3 rounded-[10px] border border-[var(--border)] bg-white text-[13.5px] outline-none focus:border-[#30AFFF] focus:ring-2 focus:ring-[#30AFFF]/20" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full h-9 px-3 rounded-[10px] border border-[var(--border)] bg-white text-[13.5px] outline-none focus:border-[#30AFFF] focus:ring-2 focus:ring-[#30AFFF]/20" />
          {err && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{err}</div>}
          <button disabled={loading} className="w-full h-9 rounded-full bg-[#0f0f0f] text-white text-[13.5px] font-[550] disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="mt-4 text-center text-[12.5px] text-[var(--muted-foreground)]">No account? <a href="/register" className="text-[#0a7bc2] font-[500]">Create one</a></div>
      </div>
    </main>
  );
}
