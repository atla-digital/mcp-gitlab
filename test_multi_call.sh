#!/bin/bash

# Test script to demonstrate multi-call session issue
echo "Testing multi-call MCP session management..."

# Get credentials (you'll need to provide actual values)
GITLAB_TOKEN="test-token"  # Replace with actual token
GITLAB_URL="https://gitlab.com/api/v4"

echo "=== Test 1: Initialize session ==="
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: $GITLAB_TOKEN" \
  -H "X-GitLab-URL: $GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"capabilities": {}}}' \
  | head -5

echo -e "\n=== Test 2: List tools (should work) ==="
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: $GITLAB_TOKEN" \
  -H "X-GitLab-URL: $GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' \
  | grep -E "(error|result)" | head -3

echo -e "\n=== Test 3: Call tool (may fail with 'Server not initialized') ==="
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: $GITLAB_TOKEN" \
  -H "X-GitLab-URL: $GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "gitlab_get_current_user", "arguments": {}}}' \
  | grep -E "(error|result)" | head -3

echo -e "\n=== Test 4: Another tool call (should also fail) ==="
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: $GITLAB_TOKEN" \
  -H "X-GitLab-URL: $GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "gitlab_list_projects", "arguments": {}}}' \
  | grep -E "(error|result)" | head -3
