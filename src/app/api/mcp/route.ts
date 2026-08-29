import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getArtifactsForUser, getCollectionsForUser, createCollection } from "@/lib/data";
import { getArtifact } from "@/lib/data";
import { putArtifactBlob } from "@/lib/blob";
import { createArtifact } from "@/lib/data";

// Hosted MCP — Streamable HTTP (Vercel serverless)
// Claude fetches tool catalog via POST {jsonrpc:"2.0", method:"tools/list"} and calls tools via "tools/call"
// Cold start 2-4s is fine (serverless wakes on catalog fetch)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOOLS = [
  {
    name: "save_artifact",
    description: "Save an HTML/MD/PDF artifact to Shelf. Private by default, returns uuid URL. Use for AI-generated explainers.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string", enum: ["html", "md", "pdf"], default: "html" },
        content: { type: "string", description: "Raw HTML or markdown" },
        description: { type: "string" },
        collectionId: { type: "string", nullable: true },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "get_artifact",
    description: "Get artifact by uuid (respects private/public)",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "list_artifacts",
    description: "List my Shelf (owned only, Drive-style — public link-only not listed)",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_collections",
    description: "List my collections",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "create_collection",
    description: "Create a collection in my Shelf",
    inputSchema: {
      type: "object",
      properties: { title: { type: "string" }, description: { type: "string" } },
      required: ["title"],
    },
  },
];

function mcpResponse(id: any, result: any) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}
function mcpError(id: any, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || body.jsonrpc !== "2.0") return mcpError(body?.id ?? null, -32600, "Invalid Request");

  const { id, method, params } = body;

  // MCP handshake
  if (method === "initialize") {
    return mcpResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "shelf-mcp", version: "0.1.0" },
    });
  }
  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 202 });
  }
  if (method === "tools/list") {
    return mcpResponse(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return mcpError(id, -32601, `Unknown tool ${name}`);

    // Auth: hosted MCP uses same shelf_token cookie / Authorization Bearer
    // For serverless, Claude should send Authorization: Bearer <jwt> or Cookie
    let user = await getCurrentUser();
    // Allow Bearer header for MCP clients
    if (!user) {
      const auth = req.headers.get("authorization");
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7);
        const { verifyToken, getUserById } = await import("@/lib/auth");
        const payload = verifyToken(token);
        if (payload) user = await getUserById(payload.sub);
      }
    }

    try {
      if (name === "save_artifact") {
        if (!user) return mcpError(id, -32000, "Not authenticated — login to Shelf and use shelf_token");
        const { title, type = "html", content, description = "", collectionId = null } = args || {};
        if (!title || !content) return mcpError(id, -32602, "title and content required");
        const newId = crypto.randomUUID();
        const { key, url } = await putArtifactBlob(newId, content, type);
        await createArtifact({ id: newId, ownerId: user.id, title: String(title).slice(0, 200), type, collectionId: collectionId || null, description: String(description).slice(0, 500), blobKey: key, blobUrl: url });
        return mcpResponse(id, {
          content: [{ type: "text", text: `Saved! id=${newId} url=/a/${newId} — private by default` }],
        });
      }
      if (name === "get_artifact") {
        const art = await getArtifact(args.id);
        if (!art) return mcpError(id, -32602, "Not found");
        // respect private
        if (!art.isPublic && (!user || art.ownerId !== user.id)) return mcpError(id, -32000, "Private — not owner");
        return mcpResponse(id, { content: [{ type: "text", text: JSON.stringify(art, null, 2) }] });
      }
      if (name === "list_artifacts") {
        if (!user) return mcpError(id, -32000, "Not authenticated");
        const arts = await getArtifactsForUser(user.id);
        return mcpResponse(id, { content: [{ type: "text", text: JSON.stringify(arts, null, 2) }] });
      }
      if (name === "list_collections") {
        if (!user) return mcpError(id, -32000, "Not authenticated");
        const cols = await getCollectionsForUser(user.id);
        return mcpResponse(id, { content: [{ type: "text", text: JSON.stringify(cols, null, 2) }] });
      }
      if (name === "create_collection") {
        if (!user) return mcpError(id, -32000, "Not authenticated");
        const colId = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || crypto.randomUUID().slice(0, 8);
        await createCollection({ id: colId, ownerId: user.id, title: args.title, description: args.description || "" });
        return mcpResponse(id, { content: [{ type: "text", text: `Created collection ${colId}` }] });
      }
    } catch (e: any) {
      return mcpError(id, -32603, e.message || "Internal error");
    }
  }

  return mcpError(id, -32601, `Method not found: ${method}`);
}

export async function GET() {
  // For health checks and Claude's initial fetch
  return NextResponse.json({ name: "shelf-mcp", version: "0.1.0", transport: "streamable-http", tools: TOOLS.map((t) => t.name) });
}
