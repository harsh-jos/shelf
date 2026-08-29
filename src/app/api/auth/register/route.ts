import { NextResponse } from "next/server";
import { createUser, signToken, setAuthCookie, getUserByUsername } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  if (await getUserByUsername(username)) return NextResponse.json({ error: "Username taken" }, { status: 409 });
  try {
    const user = await createUser(username.trim(), password);
    const token = signToken(user);
    await setAuthCookie(token);
    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}
