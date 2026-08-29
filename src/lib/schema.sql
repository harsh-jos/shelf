-- Shelf — Drive-style isolation
-- My Shelf = owned artifacts + owned collections
-- Public link = anyone with uuid can view, but not in Shelf unless saved (copy)

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists collections (
  id text primary key,
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text not null,
  color text not null default '#30AFFF',
  created_at timestamptz default now()
);
create index if not exists collections_owner_idx on collections(owner_id);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('html','md','pdf')),
  collection_id text references collections(id) on delete set null,
  description text not null,
  content text not null,
  is_public boolean not null default false,
  saved_from uuid references artifacts(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists artifacts_owner_idx on artifacts(owner_id);
create index if not exists artifacts_public_idx on artifacts(is_public);
create index if not exists artifacts_collection_idx on artifacts(collection_id);

-- RBAC (future): collection_shares, artifact_shares for editor/viewer
-- For v1, owner is the only writer. Public = viewer via link.
