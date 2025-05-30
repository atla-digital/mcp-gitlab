# Technical Context: GitLab MCP Server

## Technologies Used

### Core Technologies
- **Node.js**: Runtime environment (v16 or higher required)
- **TypeScript**: Programming language for type safety and better developer experience
- **Model Context Protocol (MCP)**: Protocol for communication with AI assistants
- **GitLab API v4**: RESTful API for GitLab operations

### Dependencies
- **@modelcontextprotocol/sdk (v1.7.0)**: MCP SDK for server implementation
- **axios**: HTTP client for GitLab API communication
- **TypeScript**: For type definitions and compilation

### Development Dependencies
- **@types/node**: TypeScript definitions for Node.js
- **typescript**: TypeScript compiler

## Development Setup

### Prerequisites
- Node.js (v20 or higher) - for optimal performance
- npm
- Docker (for containerized deployment)
- A GitLab account with API token

### Installation Steps
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile modular TypeScript structure
4. Run `npm run install-hooks` to set up git hooks for documentation sync
5. Configure deployment method (Streamable HTTP recommended)

### Environment Configuration - Multi-Mode Support

#### For Streamable HTTP Deployment (Recommended)
No environment variables needed - authentication via HTTP headers:
- `X-GitLab-Token`: GitLab API token per request
- `X-GitLab-URL`: GitLab API URL per request (optional)

#### For Legacy Stdio Mode
- `GITLAB_API_TOKEN`: Personal access token from GitLab
- `GITLAB_API_URL` (optional): URL for GitLab API, defaults to 'https://gitlab.com/api/v4'

### Enhanced Build Process
- **Modular compilation**: TypeScript compiler processes 7 domain-specific definition files
- **Consolidated exports**: Automatic consolidation in `build/tools/definitions/index.js`
- **Server compilation**: Separate HTTP and stdio server builds
- **Executable generation**: Server files made executable with chmod
- **Documentation sync**: Git hooks automatically update TOOLS.md from build outputs

## Technical Constraints

### GitLab API Limitations
- Rate limiting according to GitLab's policies
- API token permissions define available operations
- Some operations require specific user permissions in GitLab
- Integration modification may require OAuth tokens that can't be obtained through the API alone
- Webhook test operations have stricter rate limiting (5 requests per minute)

### MCP Protocol Constraints
- Limited to operations defined in MCP protocol
- Communication through stdio only
- Limited support for streaming or large data transfers
- Server must properly configure capabilities for tools and resources

### Security Considerations
- API tokens must be kept secure
- Sensitive repository data should be handled carefully
- No persistent storage of credentials

## Integration Points

### GitLab API Integration
- Uses GitLab API v4
- Authenticates with personal access token
- Supports both GitLab.com and self-hosted instances

### AI Assistant Integration
- Uses MCP protocol for communication
- Integrates with MCP-compatible AI assistants
- Provides tools and resources for GitLab operations

## Deployment - Superior Multi-Mode Options

### Production Deployment (Recommended) - Streamable HTTP
**Docker containerized deployment** with superior capabilities:

```bash
# Deploy with Docker Compose
docker compose up --build -d

# Manual Docker deployment
docker build -t mcp-gitlab .
docker run -d -p 3001:3000 --name mcp-gitlab-server mcp-gitlab
```

**Configuration for Claude Code via mcp-remote:**
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

### Legacy Local Deployment - Stdio Mode
For MCP clients that only support stdio transport:

#### For Cursor/Roo Cline
```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["/path/to/mcp-gitlab/build/index.js"],
      "env": {
        "GITLAB_API_TOKEN": "YOUR_GITLAB_API_TOKEN",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

### Production Deployment Features
- **Multi-stage Docker builds** with distroless runtime for security
- **Health monitoring** via `/health` endpoint for container orchestration
- **Resource management** with CPU and memory limits
- **Session isolation** supporting multiple concurrent clients
- **CORS support** for web-based AI assistant integration
- **Auto-restart policies** for high availability
