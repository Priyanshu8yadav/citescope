# CiteScope AI - Model Context Protocol (MCP) Server

A standalone, authenticated JSON-RPC 2.0 MCP server that exposes CiteScope's research discovery, consensus analysis, full-text resolution, and personal library exploration tools to external AI agents (Claude Desktop, Cursor, Gemini, and custom agents).

## Capabilities & Exposed Tools

1. **`citescope_search_papers`**: Search peer-reviewed literature across OpenAlex and arXiv.
2. **`citescope_get_paper`**: Retrieve detailed paper metadata, citation count, venue, and decoded abstract.
3. **`citescope_resolve_fulltext`**: Legitimate, verified Open Access PDF resolution via Unpaywall v2, arXiv, and Europe PMC with license verification.
4. **`citescope_consensus`**: Stance consensus (% Yes, % Contested, % Neutral) across empirical studies.
5. **`citescope_extract_matrix`**: Multi-paper comparison across problems, methods, datasets, and limitations.
6. **`citescope_citation_graph`**: Real citation network traversal with intent labels (Supporting, Contrasting, Mentioning).
7. **`citescope_research_gaps`**: Limitation cluster and frontier detection.
8. **`citescope_user_library`**: Scoped search of authenticated user's saved research library.

---

## Client Integration Guide

### 1. Claude Desktop Setup
Add this entry to your Claude Desktop configuration file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "citescope": {
      "command": "/Users/riyansh/citescope/backend/venv/bin/python",
      "args": [
        "/Users/riyansh/citescope/mcp_server/server.py"
      ],
      "env": {
        "CITESCOPE_API_BASE": "http://localhost:8000"
      }
    }
  }
}
```

### 2. Cursor / VS Code Setup
In Cursor / VS Code with MCP extensions enabled, configure an stdio server with:
- **Command:** `backend/venv/bin/python`
- **Arguments:** `mcp_server/server.py`
- **Environment:** `CITESCOPE_API_BASE=http://localhost:8000`

### 3. Verification
Run the integrated MCP test suite:
```bash
backend/venv/bin/python mcp_server/test_mcp.py
```

### 4. Important Authentication & Architecture Note
- Running this MCP server interfaces directly with your CiteScope instance.
- **Library Scoping:** Personal library tools require a valid `user_token`.
- **Zero Hallucination:** Paper links and licenses are verified against official academic APIs. No URLs are fabricated.
- **Consumer AI Accounts:** Using this MCP server with Claude Desktop or Cursor does NOT embed a consumer subscription into CiteScope or grant free third-party API tokens; API inference requires your own respective model provider credentials.
