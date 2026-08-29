import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION || "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("S3 env (AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) is required — no fallback.");
}

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});

export const BUCKET = "assets";

export async function putArtifactBlob(id: string, content: string, type: string): Promise<{ key: string; url: string }> {
  const ext = type === "html" ? "html" : type === "md" ? "md" : "pdf";
  const key = `artifacts/${id}.${ext}`;
  const contentType = type === "html" ? "text/html; charset=utf-8" : type === "md" ? "text/markdown; charset=utf-8" : "application/pdf";
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(content, "utf-8"),
      ContentType: contentType,
    })
  );
  // Neon storage is not public; we store the key and fetch via GetObject on read
  // For convenience we also return a key-based url that the app can resolve via /api/blob
  const url = `${endpoint}/${BUCKET}/${key}`;
  return { key, url };
}

export async function getArtifactBlob(key: string): Promise<string> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = await res.Body?.transformToString();
  return body ?? "";
}

export async function getArtifactContentById(id: string, type: string, blobKey?: string | null, blobUrl?: string | null, inlineContent?: string | null): Promise<string> {
  // All docs are in blob now; inlineContent is legacy fallback
  const key = blobKey || (blobUrl ? blobUrl.split(`/${BUCKET}/`)[1] : null) || `artifacts/${id}.${type === "html" ? "html" : type === "md" ? "md" : "pdf"}`;
  if (!key) return inlineContent || "";
  try {
    return await getArtifactBlob(key);
  } catch (e) {
    console.warn("[blob] get failed for", key, e);
    return inlineContent || "";
  }
}
