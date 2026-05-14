# MCP (Model Context Protocol) — Optional

MCP servers extend AI agents with additional capabilities: filesystem access, GitHub operations, database queries, and more.

---

## What is MCP?

MCP is an open protocol that lets AI agents connect to external "servers" that provide tools, data, and context. Each MCP server exposes a set of capabilities the agent can call.

This is an **optional feature**. The project works without any MCP servers configured.

---

## Configured Servers

See `servers.json` for the full configuration.

| Server | Purpose | Required |
|---|---|---|
| `filesystem` | Read/write files in project directories | Optional |
| `github` | Read PRs, issues, and code from GitHub | Optional |
| `postgres` | Run read-only SQL queries for debugging | Optional |

---

## How to Connect MCP Servers

### Claude Code (claude.json)
MCP servers for Claude Code are configured in `.claude/claude.json` under `mcpServers`.

### OpenCode
OpenCode does not natively support MCP. Use wrapper APIs or direct tool calls instead.

---

## Setting Up a Server

1. Install the server package: `npm install -g @modelcontextprotocol/server-filesystem`
2. Add configuration to `.claude/claude.json` (see example in `servers.json`)
3. Restart Claude Code to pick up the new server
4. Verify with: `/mcp` in the Claude Code prompt

---

## Security Notes

- MCP servers run with the permissions of the current user.
- The filesystem server is scoped to specific directories — do not add `/` as an allowed path.
- The database server should only have read access in development.
- Never configure MCP servers with production write credentials.
