# Shelf MCP

Stdio MCP for Claude/Codex to save artifacts directly to your Shelf.

### Setup

```bash
cd mcp && npm install
# login once to get a token (or use SHELF_USER/SHELF_PASS)
curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"demo","password":"demo123"}' -i
# copy shelf_token from Set-Cookie

SHELF_API_URL=http://localhost:3000 SHELF_TOKEN=<jwt> node server.js
# or for prod
SHELF_API_URL=https://shelf.vercel.app SHELF_TOKEN=<jwt> node server.js
```

### Claude Code config

`.claude/settings.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shelf": {
      "command": "node",
      "args": ["/absolute/path/to/shelf/mcp/server.js"],
      "env": { "SHELF_API_URL": "http://localhost:3000", "SHELF_TOKEN": "..." }
    }
  }
}
```

### Tools
- `save_artifact(title, type, content, description?, collectionId?)` → private by default, returns `/a/<uuid>`
- `list_artifacts` → your Shelf only (Drive-style)
- `get_artifact(id)` / `list_collections` / `create_collection`
