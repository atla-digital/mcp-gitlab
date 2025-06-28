# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript and make executable
- `npm run prepare` - Runs build (used by npm lifecycle)
- `npm run watch` - Watch TypeScript files for changes and recompile
- `npm run inspector` - Start MCP inspector for debugging server

### CI/CD & Documentation
```bash
# Install git hooks for automatic documentation generation
npm run install-hooks

# Generate tool documentation manually
npm run generate-docs
```

## Architecture Overview

This is a Model Context Protocol (MCP) server for GitLab integration built in TypeScript with **Streamable HTTP** as the primary transport. The server enables AI assistants to interact with GitLab repositories through a comprehensive set of tools.

### Streamable HTTP Transport
The server implements the Streamable HTTP MCP transport protocol, running as an HTTP service on port 3001. This allows for:
- Direct HTTP-based MCP communication
- Better performance and reliability than stdio/process-based transports
- Support for multiple concurrent clients
- Easy deployment in containerized environments

### Core Architecture

**Main Entry Point**: `src/index.ts`
- Initializes GitLabServer class with MCP capabilities
- Creates axios instance with GitLab API authentication
- Sets up request handlers for tools, resources, and capabilities

**Tool Organization**: The codebase is organized into four main functional domains:

1. **Repository Operations** (`src/handlers/repository-handlers.ts`)
   - Projects, branches, merge requests, issues
   - File operations and branch comparisons
   
2. **Integration Management** (`src/handlers/integration-handlers.ts`) 
   - Slack integration, webhooks
   - Managed by `IntegrationsManager` class
   
3. **CI/CD Operations** (`src/handlers/cicd-handlers.ts`)
   - Pipeline triggers, CI/CD variables
   - Managed by `CiCdManager` class
   
4. **User/Group Management** (`src/handlers/users-groups-handlers.ts`)
   - User and group operations, project memberships
   - Managed by `UsersGroupsManager` class

### Key Design Patterns

**Tool Registry Pattern**: `src/utils/tool-registry.ts` maps tool names to handler functions, enabling clean separation of tool definitions from implementations.

**Manager Classes**: Domain-specific manager classes (`IntegrationsManager`, `CiCdManager`, `UsersGroupsManager`) encapsulate related API operations and are injected into handlers via `HandlerContext`.

**Centralized Tool Definitions**: `src/utils/tools-data.ts` contains all tool schemas exported as `toolDefinitions` array. This file is monitored by git hooks for automatic TOOLS.md generation.

### Resource System
The server exposes GitLab projects as MCP resources via `gitlab://projects` URI, handled by `src/utils/resource-handlers.ts`.

### MCP Prompts for Workflow Guidance

This GitLab MCP server supports **MCP Prompts** - reusable workflow templates that provide step-by-step guidance for complex GitLab operations.

#### Available Prompts

**`quick-mr-review`** - A simple merge request review workflow
- **Arguments**: `project_id` (required), `merge_request_iid` (required)
- **Purpose**: Demonstrates multi-step GitLab operations for code review
- **Steps**: Get MR details → Get changes → Review → Add comments

#### Using Prompts

1. **List available prompts:**
   ```json
   {"jsonrpc": "2.0", "id": 1, "method": "prompts/list", "params": {}}
   ```

2. **Get prompt with parameters:**
   ```json
   {
     "jsonrpc": "2.0", 
     "id": 1, 
     "method": "prompts/get", 
     "params": {
       "name": "quick-mr-review",
       "arguments": {
         "project_id": "web/runner",
         "merge_request_iid": "5"
       }
     }
   }
   ```

#### Workflow Integration

Prompts provide templates that guide you through multi-step operations:
- **Structured guidance** for complex workflows
- **Parameter substitution** for specific projects/MRs
- **Tool chaining** examples showing how to combine multiple GitLab tools
- **Best practices** for common development tasks

This standardizes how AI agents can access workflow knowledge and ensures consistent, reliable execution of complex GitLab operations.

### Client Configuration

#### For Streamable HTTP Compatible Clients
Direct connection to the Streamable HTTP server:
```
http://localhost:3001/mcp
```

#### For Claude Code (via mcp-remote proxy)
Since Claude Code doesn't support Streamable HTTP natively, use `mcp-remote` as a proxy:

```json
{
  "mcpServers": {
    "sm-gitlab": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "http://host.docker.internal:3001/mcp",
        "--allow-http",
        "--header",
        "X-GitLab-Token: ${GITLAB_TOKEN}",
        "--header",
        "X-GitLab-URL: ${GITLAB_URL}"
      ],
      "env": {
        "GITLAB_TOKEN": "your_gitlab_token",
        "GITLAB_URL": "https://your-gitlab-instance.com/api/v4"
      }
    }
  }
}
```

### Authentication
GitLab credentials are passed as HTTP headers:
- `X-GitLab-Token` - Required GitLab API token
- `X-GitLab-URL` - GitLab API base URL (defaults to https://gitlab.com/api/v4)

## Adding New Tools

When adding a new GitLab API tool to the MCP server, follow these steps:

### 1. Research GitLab API
- Check GitLab API documentation for endpoint, parameters, and authentication requirements
- Identify required vs optional parameters
- Note any special considerations (authentication, permissions, etc.)

### 2. Add Tool Definition
**File**: `src/utils/tools-data.ts`
- Add new tool object to `toolDefinitions` array
- Follow existing naming convention: `gitlab_[action]_[resource]`
- Include complete JSON Schema for `inputSchema`
- Mark required parameters in `required` array

Example:
```typescript
{
  name: 'gitlab_create_issue',
  description: 'Create a new issue in a GitLab project',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID or URL-encoded path of the project'
      },
      title: {
        type: 'string',
        description: 'The title of the issue'
      }
      // ... other properties
    },
    required: ['project_id', 'title']
  }
}
```

### 3. Implement Handler Function
**File**: `src/handlers/[domain]-handlers.ts` (choose appropriate domain)
- Create handler function following `ToolHandler` type
- Validate required parameters using `McpError` with `ErrorCode.InvalidParams`
- Use `context.axiosInstance` for GitLab API calls
- Return formatted response using `formatResponse(response.data)`

Example:
```typescript
export const createIssue: ToolHandler = async (params, context) => {
  const { project_id, title, description } = params.arguments || {};
  if (!project_id || !title) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and title are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/issues`,
    { title, description }
  );
  return formatResponse(response.data);
};
```

### 4. Register Tool in Registry
**File**: `src/utils/tool-registry.ts`
- Import handler function
- Add mapping entry: `tool_name: handlerFunction`
- Place in appropriate section (Repository, Integration, CI/CD, Users/Groups)

Example:
```typescript
gitlab_create_issue: repoHandlers.createIssue,
```

### 5. Build and Test
```bash
npm run build
```
- Verify TypeScript compilation succeeds
- Check that new tool compiles without errors

### 6. Deploy New Version
For Docker deployment:
```bash
docker compose down
docker compose up --build -d
```

For direct deployment:
```bash
npm run build
# Restart your MCP server process
```

### 7. Verify Deployment
Test the new tool is available:
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: your_token" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

## API Testing and Verification

The MCP server runs an HTTP endpoint on port 3001 that can be tested directly. Here's how to properly test the API:

### Required Headers
All API requests must include these headers:
```bash
-H "Content-Type: application/json"
-H "Accept: application/json, text/event-stream"
-H "X-GitLab-Token: your_gitlab_token"
-H "X-GitLab-URL: your_gitlab_api_url"  # Optional, defaults to https://gitlab.com/api/v4
```

### GitLab Configuration
The gitlab token and address can be obtained from `.mcp.json`

### Response Format
The API returns responses in Server-Sent Events (SSE) format:
```
event: message
data: {"result": {"tools": [...]},"jsonrpc":"2.0","id":1}
```

### Extracting JSON from SSE
To get valid JSON from the SSE response, use:
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: YOUR_TOKEN" \
  -H "X-GitLab-URL: YOUR_GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' \
  | grep '^data:' | sed 's/^data: //' | jq '.'
```

### Common API Verification Commands

**Count total tools:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: YOUR_TOKEN" \
  -H "X-GitLab-URL: YOUR_GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' \
  | grep '^data:' | sed 's/^data: //' | jq '.result.tools | length'
```

**List all tool names:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: YOUR_TOKEN" \
  -H "X-GitLab-URL: YOUR_GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' \
  | grep '^data:' | sed 's/^data: //' | jq -r '.result.tools[] | .name' | sort
```

**Test specific tool execution:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: YOUR_TOKEN" \
  -H "X-GitLab-URL: YOUR_GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "gitlab_get_project_id", "arguments": {"remote_url": "git@gitlab.com:group/project.git"}}}' \
  | grep '^data:' | sed 's/^data: //' | jq '.result'
```

**Verify specific tools exist:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-GitLab-Token: YOUR_TOKEN" \
  -H "X-GitLab-URL: YOUR_GITLAB_URL" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' \
  | grep '^data:' | sed 's/^data: //' | jq -r '.result.tools[] | .name' \
  | grep -E 'gitlab_(get_issue|update_issue|create_branch|list_pipelines)'
```

### Health Check
Test server health without GitLab authentication:
```bash
curl http://localhost:3001/health
```

### Troubleshooting

**Common Issues:**
- Missing `text/event-stream` in Accept header → "Not Acceptable" error
- Missing GitLab token → "GitLab API token required" error  
- Invalid GitLab token → Authentication fails during session creation
- Wrong GitLab URL → Connection timeouts or 404 errors

**Debug Steps:**
1. Check container status: `docker compose ps`
2. View server logs: `docker compose logs -f`
3. Test health endpoint first: `curl http://localhost:3001/health`
4. Verify GitLab credentials work: Test with simple GitLab API call

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes automated CI/CD pipelines using GitHub Actions:

#### Docker Build & Publish (`.github/workflows/docker-publish.yml`)
- **Triggers**: Push to `main` branch, release publication
- **Features**:
  - Multi-platform builds (linux/amd64, linux/arm64)
  - Publishes to GitHub Container Registry (ghcr.io)
  - Build caching for performance
  - Artifact attestations for security
  - Automatic tagging (branch, PR, semver, latest)

#### CI Pipeline (`.github/workflows/ci.yml`)
- **Triggers**: Push to `main`/`develop`, pull requests
- **Features**:
  - Multi-version Node.js testing (20, 22)
  - TypeScript compilation and type checking
  - Build validation
  - HTTP server startup testing
  - Docker container testing with distroless-compatible health checks
  - TOOLS.md documentation validation

### Git Hooks & Documentation

#### Pre-commit Hook (`git-hooks/pre-commit`)
- Automatically regenerates `TOOLS.md` when tool definitions change
- Monitors changes to `src/tools/definitions/` and `src/utils/tools-data.ts`
- Runs build process to ensure latest compiled definitions
- Adds updated documentation to the commit

#### Documentation Generation (`scripts/generate-tools-md.js`)
- Generates comprehensive tool documentation from TypeScript definitions
- Categorizes tools by function (Repository, Integrations, CI/CD, User Management)
- Creates formatted markdown with parameter tables and default values
- Maintains table of contents with GitHub-compatible anchors

### Setup Commands
```bash
# Install git hooks for automatic documentation
npm run install-hooks

# Generate documentation manually
npm run generate-docs

# Complete build and documentation workflow
npm run build && npm run generate-docs
```

## Important Development Notes

- Tool definitions in `tools-data.ts` automatically generate TOOLS.md via pre-commit hook
- All handlers receive `HandlerContext` containing axios instance and manager classes
- Error handling is centralized in `response-formatter.ts`
- The server binary is built to `build/index.js` and made executable during build
- Always use `docker compose up --build` when deploying to ensure latest code is included
- Tool registry maps tool names to handler functions for clean separation of concerns
- Use GitHub Actions for CI/CD automation with comprehensive testing and validation