// Drive-style store — now fully Postgres + S3. No in-memory fallback, no seeding.
// All docs are in blob regardless of size.

import { pool, ensureTables } from "./db";
import { getArtifactContentById } from "./blob";

export type ArtifactType = "html" | "md" | "pdf";

export const LIMIT_BYTES = 40 * 1024 * 1024; // 40 MB per user, harsh is unlimited

export type Artifact = {
  id: string;
  title: string;
  type: ArtifactType;
  collectionId: string | null;
  description: string;
  createdAt: string;
  content: string; // fetched from blob
  ownerId: string;
  isPublic: boolean;
  savedFrom?: string | null;
  blobKey?: string | null;
  blobUrl?: string | null;
  sizeBytes?: number;
};

export type Collection = {
  id: string;
  title: string;
  description: string;
  color: string;
  ownerId: string;
};

function rowToArtifact(row: any): Artifact {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    collectionId: row.collection_id,
    description: row.description,
    createdAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "",
    content: "", // filled via getArtifactWithContent
    ownerId: row.owner_id,
    isPublic: row.is_public,
    savedFrom: row.saved_from,
    blobKey: row.blob_key,
    blobUrl: row.blob_url,
    sizeBytes: row.size_bytes ?? 0,
  };
}

function rowToCollection(row: any): Collection {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    ownerId: row.owner_id,
  };
}

export async function getArtifact(id: string): Promise<Artifact | null> {
  await ensureTables();
  const { rows } = await pool.query("select * from artifacts where id = $1 limit 1", [id]);
  if (!rows[0]) return null;
  const art = rowToArtifact(rows[0]);
  art.content = await getArtifactContentById(art.id, art.type, art.blobKey, art.blobUrl, rows[0].content);
  return art;
}

export async function getArtifactRaw(id: string) {
  await ensureTables();
  const { rows } = await pool.query("select * from artifacts where id = $1 limit 1", [id]);
  return rows[0] ?? null;
}

export async function getCollection(id: string): Promise<Collection | null> {
  await ensureTables();
  const { rows } = await pool.query("select * from collections where id = $1 limit 1", [id]);
  return rows[0] ? rowToCollection(rows[0]) : null;
}

export async function getArtifactsByCollection(collectionId: string, userId?: string): Promise<Artifact[]> {
  await ensureTables();
  const q = userId
    ? await pool.query("select * from artifacts where collection_id = $1 and owner_id = $2 order by created_at desc", [collectionId, userId])
    : await pool.query("select * from artifacts where collection_id = $1 order by created_at desc", [collectionId]);
  const arts: Artifact[] = [];
  for (const row of q.rows) {
    const a = rowToArtifact(row);
    a.content = await getArtifactContentById(a.id, a.type, a.blobKey, a.blobUrl, row.content);
    arts.push(a);
  }
  return arts;
}

export async function getArtifactsForUser(userId: string): Promise<Artifact[]> {
  await ensureTables();
  const { rows } = await pool.query("select * from artifacts where owner_id = $1 order by created_at desc", [userId]);
  const out: Artifact[] = [];
  for (const row of rows) {
    const a = rowToArtifact(row);
    a.content = await getArtifactContentById(a.id, a.type, a.blobKey, a.blobUrl, row.content);
    out.push(a);
  }
  return out;
}

export async function getCollectionsForUser(userId: string): Promise<Collection[]> {
  await ensureTables();
  const { rows } = await pool.query("select * from collections where owner_id = $1 order by created_at asc", [userId]);
  return rows.map(rowToCollection);
}

export async function setArtifactPublic(id: string, isPublic: boolean) {
  await ensureTables();
  await pool.query("update artifacts set is_public = $2 where id = $1", [id, isPublic]);
}

export async function createArtifact(a: { id: string; ownerId: string; title: string; type: ArtifactType; collectionId: string | null; description: string; blobKey: string; blobUrl: string; sizeBytes?: number }) {
  await ensureTables();
  await pool.query(
    "insert into artifacts (id, owner_id, title, type, collection_id, description, content, blob_key, blob_url, is_public, saved_from, size_bytes) values ($1,$2,$3,$4,$5,$6,'',$7,$8,false,null,$9)",
    [a.id, a.ownerId, a.title, a.type, a.collectionId, a.description, a.blobKey, a.blobUrl, a.sizeBytes ?? 0]
  );
}

export async function getStorageUsage(userId: string): Promise<{ used: number; limit: number; unlimited: boolean }> {
  await ensureTables();
  const { rows } = await pool.query("select coalesce(sum(size_bytes),0) as used from artifacts where owner_id = $1", [userId]);
  const { rows: urows } = await pool.query("select username from users where id = $1", [userId]);
  const username = urows[0]?.username;
  const unlimited = username === "harsh";
  const used = Number(rows[0].used) || 0;
  return { used, limit: unlimited ? Infinity : LIMIT_BYTES, unlimited };
}

export async function createCollection(c: { id: string; ownerId: string; title: string; description: string; color?: string }) {
  await ensureTables();
  await pool.query("insert into collections (id, owner_id, title, description, color) values ($1,$2,$3,$4,$5)", [c.id, c.ownerId, c.title, c.description, c.color || "#30AFFF"]);
}

export function canAccessArtifact(artifact: Artifact, userId: string | null) {
  if (artifact.isPublic) return true;
  if (userId && artifact.ownerId === userId) return true;
  return false;
}
