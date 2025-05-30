# GitLab Streamable HTTP MCP Server Documentation

This document describes the Streamable HTTP implementation using the official MCP SDK StreamableHTTPServerTransport for multi-client GitLab access.

## Overview

The Streamable HTTP server uses the official MCP SDK `StreamableHTTPServerTransport` to provide the latest MCP protocol support while enabling multiple clients with separate GitLab configurations. Each client gets their own MCP server instance and session.

## Features

- **Latest MCP Protocol**: Uses `@modelcontextprotocol/sdk` Streamable HTTP transport
- **Future-Proof**: Streamable HTTP is the successor to SSE in the MCP SDK
- **Multi-client Support**: Each client gets isolated MCP server instance
- **Per-client Configuration**: GitLab API token and URL specified per connection
- **Session Management**: Automatic session tracking and cleanup
- **Streaming & Direct Responses**: Supports both SSE streaming and direct JSON responses
- **Resumability Support**: Built-in support for connection resumption (when event store is configured)

## Base URL

Default: `http://localhost:3000`

## Endpoints

### Health Check

**GET** `/health`

Returns server health and active client count.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-26T10:30:00.000Z",
  "activeClients": 3,
  "transport": "streamable-http"
}
```

### List Available Tools

**GET** `/tools`

Returns list of all available GitLab tools (same as MCP `listTools`).

**Response:**
```json
{
  "tools": [
    {
      "name": "gitlab_list_projects",
      "description": "List GitLab projects accessible to the user",
      "inputSchema": { ... }
    }
  ]
}
```

### Active Sessions

**GET** `/sessions`

Returns information about active client sessions.

**Response:**
```json
{
  "activeSessions": [
    {
      "id": "session-uuid",
      "gitlabApiUrl": "https://gitlab.com/api/v4",
      "createdAt": "2025-01-26T10:00:00.000Z",
      "lastUsed": "2025-01-26T10:30:00.000Z"
    }
  ]
}
```

### Establish MCP Connection

**GET** `/mcp?token=YOUR_TOKEN&url=GITLAB_URL`

Establishes a new MCP connection with Streamable HTTP transport.

**Query Parameters:**
- `token` (required): GitLab API token
- `url` (optional): GitLab API URL (defaults to `https://gitlab.com/api/v4`)
- `sessionId` (optional): Resume existing session

**Response:** MCP initialization response or SSE stream

**Example:**
```bash
curl "http://localhost:3000/mcp?token=glpat-xxxxxxxxxxxxxxxxxxxx&url=https://gitlab.com/api/v4"
```

The server will:
1. Validate the GitLab token by calling `/user` endpoint
2. Create a new MCP server instance for this client
3. Return MCP initialization response with session ID
4. Optionally start SSE stream for real-time communication

### Send MCP Messages

**POST** `/mcp`

Send MCP protocol messages to a specific client session.

**Headers:**
- `Content-Type: application/json`
- `X-Session-ID: your-session-id`

**Body:** Standard MCP JSON-RPC message

**Example:**
```bash
curl -X POST "http://localhost:3000/mcp" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: your-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "gitlab_list_projects",
      "arguments": {"per_page": 10}
    }
  }'
```

### Terminate Session

**DELETE** `/mcp`

Terminate a client session.

**Headers:**
- `X-Session-ID: your-session-id`

**Example:**
```bash
curl -X DELETE "http://localhost:3000/mcp" \
  -H "X-Session-ID: your-session-id"
```

## MCP Client Usage

### Using MCP Inspector

```bash
# Start the Streamable HTTP server
npm run start:http

# In another terminal, use MCP inspector with Streamable HTTP
npx @modelcontextprotocol/inspector streamableHttp "http://localhost:3000/mcp?token=YOUR_TOKEN"
```

### Using Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gitlab-streamable": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/inspector",
        "streamableHttp",
        "http://localhost:3000/mcp?token=YOUR_GITLAB_TOKEN&url=https://gitlab.com/api/v4"
      ]
    }
  }
}
```

### Using Custom MCP Client

```javascript
import { StreamableHttpClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new StreamableHttpClientTransport(
  new URL('http://localhost:3000/mcp?token=YOUR_TOKEN&url=https://gitlab.com/api/v4')
);

const client = new Client(
  { name: 'my-gitlab-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool('gitlab_list_projects', {
  per_page: 10
});
console.log(result);
```

## Session Management

- **Automatic Session Creation**: New sessions created on first connection
- **Session Validation**: Session ID required for POST/DELETE requests
- **Automatic Cleanup**: Inactive sessions (24h) are automatically removed
- **Session Isolation**: Each client has completely isolated GitLab access
- **Connection Validation**: GitLab tokens are validated on connection
- **Error Handling**: Proper MCP error responses for invalid requests

## Advantages over SSE

1. **Future-Proof**: Streamable HTTP is the official successor to SSE in MCP SDK
2. **Better Performance**: Optimized for both streaming and direct responses
3. **Resumability**: Built-in support for connection resumption
4. **Improved Error Handling**: Better error recovery and reporting
5. **Session Management**: More robust session handling
6. **Protocol Compliance**: Latest MCP protocol features
7. **Transport Flexibility**: Supports both streaming and direct HTTP responses

## Docker Usage

### Streamable HTTP Server (Default)

```bash
# Build and run Streamable HTTP server
docker-compose up -d mcp-gitlab-http

# Server available at http://localhost:3000
```

### Traditional MCP (Single Client)

```bash
# Run traditional MCP server (requires env vars)
echo "GITLAB_API_TOKEN=your_token" > .env
docker-compose --profile mcp up -d mcp-gitlab-mcp
```

## Security Considerations

1. **Token Transmission**: GitLab tokens are sent as URL parameters. Use HTTPS in production.
2. **Session Security**: Each session is isolated with unique session IDs.
3. **Automatic Cleanup**: Prevents session accumulation and memory leaks.
4. **Input Validation**: All MCP messages are validated by the SDK.
5. **CORS Support**: Configurable CORS headers for web clients.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Start Streamable HTTP server in development
npm run start:http

# Watch mode
npm run watch
# In another terminal:
node build/streamable-http-server.js
```

## Configuration Options

The Streamable HTTP transport supports several configuration options:

```typescript
new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(), // Generate unique session IDs
  onsessioninitialized: (sessionId) => {
    console.log(`New session: ${sessionId}`);
  },
  enableJsonResponse: false, // Use SSE streaming by default
  eventStore: undefined // Optional: Enable resumability
})
```

## Troubleshooting

### Connection Issues

1. **Invalid Token**: Check GitLab API token has correct permissions
2. **Wrong URL**: Verify GitLab API URL is correct (include `/api/v4`)
3. **Network**: Ensure server can reach GitLab instance
4. **CORS**: Check CORS headers for web clients

### Session Issues

1. **Session Not Found**: Session may have expired or been cleaned up
2. **Missing Session ID**: Include `X-Session-ID` header in POST/DELETE requests
3. **Multiple Sessions**: Each connection creates a new session
4. **Memory Usage**: Monitor active sessions via `/sessions` endpoint

## Migration from SSE

If migrating from the SSE implementation:

1. Update client connections from `/sse` to `/mcp`
2. Use `streamableHttp` instead of `sse` in MCP inspector
3. Include session ID in headers instead of query params for POST requests
4. Update Docker configuration to use new service names

This Streamable HTTP implementation provides the most modern and future-proof MCP transport with excellent multi-client support.