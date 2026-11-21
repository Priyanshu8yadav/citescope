#!/usr/bin/env python3
"""
Test script for CiteScope MCP Server
Simulates an MCP client (Claude Desktop / Cursor) sending:
1. 'initialize'
2. 'tools/list'
3. 'tools/call' for citescope_search_papers
4. 'tools/call' for citescope_resolve_fulltext
"""

import subprocess
import json
import os
import sys

VENV_PYTHON = os.path.abspath("backend/venv/bin/python")
SERVER_SCRIPT = os.path.abspath("mcp_server/server.py")

def run_mcp_test():
    proc = subprocess.Popen(
        [VENV_PYTHON, SERVER_SCRIPT],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    def send_recv(msg: dict):
        line = json.dumps(msg) + "\n"
        proc.stdin.write(line)
        proc.stdin.flush()
        resp_line = proc.stdout.readline()
        return json.loads(resp_line.strip())

    print("--> 1. Testing 'initialize'...")
    init_res = send_recv({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"}
        }
    })
    print("Initialize response:", json.dumps(init_res, indent=2))
    assert init_res["result"]["serverInfo"]["name"] == "citescope-mcp-server"

    print("\n--> 2. Testing 'tools/list'...")
    tools_res = send_recv({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    })
    tool_names = [t["name"] for t in tools_res["result"]["tools"]]
    print(f"Discovered {len(tool_names)} tools: {tool_names}")
    assert "citescope_search_papers" in tool_names
    assert "citescope_resolve_fulltext" in tool_names
    assert "citescope_consensus" in tool_names

    print("\n--> 3. Testing 'tools/call' (citescope_resolve_fulltext)...")
    call_res = send_recv({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "citescope_resolve_fulltext",
            "arguments": {
                "doi": "10.48550/arXiv.1706.03762"
            }
        }
    })
    print("Tool call result:")
    content_text = call_res["result"]["content"][0]["text"]
    parsed = json.loads(content_text)
    print(json.dumps(parsed, indent=2))
    assert parsed["is_oa"] is True
    assert "arxiv.org" in parsed["pdf_url"]

    print("\n[SUCCESS] CiteScope MCP Server passed all protocol tests!")
    proc.terminate()

if __name__ == "__main__":
    run_mcp_test()
