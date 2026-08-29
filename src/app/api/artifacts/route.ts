import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getArtifactsForUser, createArtifact } from "@/lib/data";
import { putArtifactBlob } from "@/lib/blob";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const rows = await getArtifactsForUser(user.id);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: any;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string) || file?.name || "Untitled";
    const type = (form.get("type") as string) || (file?.name.endsWith(".md") ? "md" : file?.name.endsWith(".pdf") ? "pdf" : "html");
    const description = (form.get("description") as string) || "";
    const collectionId = (form.get("collectionId") as string) || null;
    let content = "";
    if (file) content = await file.text();
    body = { title, type, description, collectionId, content };
  } else {
    body = await req.json().catch(() => ({}));
  }

  const { title, type = "html", description = "", collectionId = null, content = "" } = body;
  if (!title || !content) return NextResponse.json({ error: "title and content required" }, { status: 400 });
  if (!["html", "md", "pdf"].includes(type)) return NextResponse.json({ error: "invalid type" }, { status: 400 });

  const bytes = Buffer.byteLength(content, "utf-8");
  const { getStorageUsage, LIMIT_BYTES } = await import("@/lib/data");
  const usage = await getStorageUsage(user.id);
  if (!usage.unlimited && usage.used + bytes > LIMIT_BYTES) {
    return NextResponse.json({ error: `Storage limit exceeded: ${formatBytes(usage.used)} / 40 MB used` }, { status: 413 });
  }

  const id = crypto.randomUUID();
  // All docs go to blob regardless of size
  const { key, url: blobUrl } = await putArtifactBlob(id, content, type);

  await createArtifact({
    id,
    ownerId: user.id,
    title: String(title).slice(0, 200),
    type,
    collectionId: collectionId || null,
    description: String(description).slice(0, 500),
    blobKey: key,
    blobUrl,
    sizeBytes: bytes,
  });

  return NextResponse.json({ ok: true, id, url: `/a/${id}`, blobUrl }, { status: 201 });
}
