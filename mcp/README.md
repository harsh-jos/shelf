# Shelf MCP — hosted + local

Shelf now hosts MCP at `https://your-shelf.vercel.app/api/mcp` (Streamable HTTP, Vercel serverless). No separate deploy — same Next.js app.

**Cold start 2-4s is expected** — serverless wakes when Claude fetches the tool catalog. After that it’s warm.

### Hosted (recommended)
Claude Code `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "shelf": {
      "command": "npx",
      "args": ["mcp-remote", "https://shelf.vercel.app/api/mcp", "--header", "Authorization: Bearer <shelf_token>"],
      "env": {}
    }
  }
}
```
Or with `mcp-remote` stdio→HTTP bridge. Get token via:
```bash
curl -X POST https://shelf.vercel.app/api/auth/login -H 'Content-Type: application/json' -d '{"username":"demo","password":"demo123"}' -i
# copy shelf_token from Set-Cookie → use as Bearer
```

Normalize: `POST https://shelf.vercel.app/api/mcp` with JSON-RPC `{"jsonrpc":"2.0","id":1,"method":"tools/list"}` returns 5 tools.

### Local stdio (dev)
```bash
cd mcp && npm install
SHELF_API_URL=http://localhost:3000 SHELF_TOKEN=<jwt> node server.js
```
Config:
```json
{ "mcpServers": { "shelf": { "command": "node", "args": ["/absolute/path/to/shelf/mcp/server.js"], "env": { "SHELF_API_URL": "http://localhost:3000", "SHELF_TOKEN": "..." } } } }
```

### Tools
- `save_artifact(title, type, content, description?, collectionId?)` → private by default, `isPublic=false`, S3 `assets/artifacts/<uuid>`, returns `/a/<uuid>`
- `list_artifacts` / `get_artifact(id)` / `list_collections` / `create_collection`

All respect Drive isolation — public link never appears in Shelf until `save`.

