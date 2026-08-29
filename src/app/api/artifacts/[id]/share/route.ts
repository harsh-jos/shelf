import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getArtifact, setArtifactPublic } from "@/lib/data";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const artifact = await getArtifact(id);
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (artifact.ownerId !== user.id) return NextResponse.json({ error: "Not owner" }, { status: 403 });

  await setArtifactPublic(id, true);
  const url = `/a/${id}`;
  return NextResponse.json({ ok: true, isPublic: true, url });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ isPublic: artifact.isPublic });
}
