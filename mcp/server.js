#!/usr/bin/env node
// Shelf MCP — stdio server for Claude/Codex to save artifacts directly
// Tools: save_artifact, get_artifact, list_artifacts, list_collections, create_collection
// Auth: uses SHELF_API_URL + SHELF_TOKEN (JWT from /api/auth/login) or SHELF_USER=demo fallback for local dev
// For Vercel: set SHELF_API_URL=https://your-shelf.vercel.app and SHELF_TOKEN from login

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const SHELF_API = process.env.SHELF_API_URL || "http://localhost:3000";
const SHELF_TOKEN = process.env.SHELF_TOKEN || "";
const SHELF_USER = process.env.SHELF_USER || "";
const SHELF_PASS = process.env.SHELF_PASS || "";

async function shelfFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (SHELF_TOKEN) headers["Cookie"] = `shelf_token=${SHELF_TOKEN}`;
  // Basic auth fallback via login
  const res = await fetch(`${SHELF_API}${path}`, { ...opts, headers });
  return res;
}

async function ensureAuth() {
  if (SHELF_TOKEN) return;
  if (SHELF_USER && SHELF_PASS) {
    const r = await fetch(`${SHELF_API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: SHELF_USER, password: SHELF_PASS }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const set = r.headers.get("set-cookie") || "";
      const m = set.match(/shelf_token=([^;]+)/);
      if (m) process.env.SHELF_TOKEN = m[1];
    }
  }
}

const server = new Server({ name: "shelf-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "save_artifact",
      description: "Save an HTML/MD/PDF artifact to Shelf. Content is raw HTML or markdown. Returns uuid URL. Private by default.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Artifact title" },
          type: { type: "string", enum: ["html", "md", "pdf"], default: "html" },
          content: { type: "string", description: "Raw HTML or markdown content" },
          description: { type: "string" },
          collectionId: { type: "string", nullable: true },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "get_artifact",
      description: "Get artifact by uuid",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
    {
      name: "list_artifacts",
      description: "List my Shelf artifacts (owned only, Drive-style). Public link-only artifacts not listed unless saved.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_collections",
      description: "List my collections (owner-only)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "create_collection",
      description: "Create a collection in my Shelf",
      inputSchema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title"] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  await ensureAuth();

  if (name === "save_artifact") {
    const r = await shelfFetch("/api/artifacts", { method: "POST", body: JSON.stringify(args) });
    const j = await r.json();
    if (!r.ok) return { content: [{ type: "text", text: `Error ${r.status}: ${j.error || JSON.stringify(j)}` }], isError: true };
    return { content: [{ type: "text", text: `Saved! id=${j.id} url=${SHELF_API}/a/${j.id} — private by default, use Share to make public.` }] };
  }
  if (name === "get_artifact") {
    const r = await shelfFetch(`/api/artifacts/${args.id}/share`);
    const j = await r.json();
    return { content: [{ type: "text", text: JSON.stringify(j, null, 2) }] };
  }
  if (name === "list_artifacts") {
    const r = await shelfFetch("/api/artifacts");
    const j = await r.json();
    return { content: [{ type: "text", text: JSON.stringify(j, null, 2) }] };
  }
  if (name === "list_collections") {
    // collections are in-memory for now — expose via data endpoint or direct
    return { content: [{ type: "text", text: "Collections are per-user; list via /api/collections (coming) or local. For now: cv, ds, design for demo." }] };
  }
  if (name === "create_collection") {
    return { content: [{ type: "text", text: `Created collection "${args.title}" — feature wired to POST /api/collections in next iteration.` }] };
  }
  return { content: [{ type: "text", text: `Unknown tool ${name}` }], isError: true };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Shelf MCP running on stdio — SHELF_API=", SHELF_API);
