import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getArtifact } from "@/lib/data";
import { pool, ensureTables } from "@/lib/db";
import { getArtifactContentById, putArtifactBlob } from "@/lib/blob";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const original = await getArtifact(id);
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!original.isPublic && original.ownerId !== user.id) {
    return NextResponse.json({ error: "Not shareable" }, { status: 403 });
  }
  if (original.ownerId === user.id) {
    return NextResponse.json({ error: "Already in your Shelf", artifactId: original.id }, { status: 409 });
  }

  await ensureTables();
  const { rows } = await pool.query("select id from artifacts where owner_id = $1 and saved_from = $2 limit 1", [user.id, original.id]);
  if (rows[0]) {
    return NextResponse.json({ ok: true, artifactId: rows[0].id, alreadySaved: true });
  }

  // Fetch original content from blob to copy
  const raw = await pool.query("select content, blob_key, blob_url, type, size_bytes from artifacts where id = $1 limit 1", [id]);
  const origRow = raw.rows[0];
  const content = await getArtifactContentById(id, origRow.type, origRow.blob_key, origRow.blob_url, origRow.content);
  const bytes = origRow.size_bytes || Buffer.byteLength(content, "utf-8");

  const { getStorageUsage, LIMIT_BYTES } = await import("@/lib/data");
  const usage = await getStorageUsage(user.id);
  if (!usage.unlimited && usage.used + bytes > LIMIT_BYTES) {
    return NextResponse.json({ error: `Storage limit exceeded: ${(usage.used / (1024 * 1024)).toFixed(2)} MB / 40 MB used` }, { status: 413 });
  }

  const newId = crypto.randomUUID();
  const { key, url } = await putArtifactBlob(newId, content, original.type);

  await pool.query(
    "insert into artifacts (id, owner_id, title, type, collection_id, description, content, blob_key, blob_url, is_public, saved_from, size_bytes) values ($1,$2,$3,$4,$5,$6,'',$7,$8,false,$9,$10)",
    [newId, user.id, original.title, original.type, null, original.description, key, url, original.id, bytes]
  );

  return NextResponse.json({ ok: true, artifactId: newId });
}
