import { NextResponse } from "next/server";
import { getUserByUsername, verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const user = await getUserByUsername(username.trim());
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const token = signToken(user);
  await setAuthCookie(token);
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
}
