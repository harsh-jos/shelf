import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required — no fallback. Set it in .env / Vercel env.");
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

let ensured = false;

export async function ensureTables() {
  if (ensured) return;
  ensured = true;
  const client = await pool.connect();
  try {
    await client.query(`create extension if not exists "pgcrypto";`);
    await client.query(`
      create table if not exists users (
        id uuid primary key default gen_random_uuid(),
        username text unique not null,
        password_hash text not null,
        created_at timestamptz default now()
      );
    `);
    await client.query(`
      create table if not exists collections (
        id text primary key,
        owner_id uuid not null references users(id) on delete cascade,
        title text not null,
        description text not null,
        color text not null default '#30AFFF',
        created_at timestamptz default now()
      );
    `);
    await client.query(`
      create table if not exists artifacts (
        id uuid primary key default gen_random_uuid(),
        owner_id uuid not null references users(id) on delete cascade,
        title text not null,
        type text not null check (type in ('html','md','pdf')),
        collection_id text references collections(id) on delete set null,
        description text not null,
        content text not null default '',
        blob_url text,
        blob_key text,
        is_public boolean not null default false,
        saved_from uuid references artifacts(id) on delete set null,
        created_at timestamptz default now()
      );
    `);
    // migrate older schema: add blob_key if missing
    await client.query(`alter table artifacts add column if not exists blob_key text;`);
    await client.query(`alter table artifacts add column if not exists blob_url text;`);
    await client.query(`alter table artifacts add column if not exists saved_from uuid;`);
    await client.query(`create index if not exists collections_owner_idx on collections(owner_id);`);
    await client.query(`create index if not exists artifacts_owner_idx on artifacts(owner_id);`);
    await client.query(`create index if not exists artifacts_public_idx on artifacts(is_public);`);
  } finally {
    client.release();
  }
}

// Ensure on module load (non-blocking)
ensureTables().catch((e) => console.warn("[db] ensureTables failed", e));
