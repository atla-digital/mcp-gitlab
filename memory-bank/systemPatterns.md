# System Patterns: GitLab MCP Server

## Architecture Overview
The GitLab MCP Server implements a **modern modular architecture** with multi-transport support:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Multi-Client   │    │  Streamable     │    │   Modular       │
│  AI Assistants  │◄──►│  HTTP Server    │◄──►│  GitLab API     │
│                 │    │  (Port 3001)    │    │  Integration    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                    ┌─────────────────┐
                    │                 │
                    │  Session Mgmt   │
                    │  & Health       │
                    │  Monitoring     │
                    └─────────────────┘
```

The server provides **superior deployment capabilities** through:
- **Multi-client HTTP endpoint** supporting concurrent AI assistant connections
- **Session-based authentication** allowing different GitLab tokens per client
- **Docker containerization** with health monitoring and resource management
- **Modular codebase** with focused domain separation and clear boundaries

## Core Design Patterns

### 1. Server Initialization Pattern
The server is initialized with proper capability configuration:
- Explicit declaration of supported capabilities (`canListTools`, `canCallTools`, etc.)
- Proper configuration of tools and resources capabilities objects
- Configuration using the MCP SDK 1.7.0 patterns

### 2. Request Handler Pattern
The server implements request handlers for different MCP protocol operations:
- `ListToolsRequestSchema`: Lists available GitLab tools
- `CallToolRequestSchema`: Executes GitLab API operations
- `ListResourcesRequestSchema`: Lists available GitLab resources
- `ReadResourceRequestSchema`: Reads GitLab resources

### 3. Adapter Pattern
The server adapts GitLab API responses to MCP protocol responses, translating between different data formats and protocols.

### 4. Configuration Pattern
The server uses environment variables for configuration, allowing flexible deployment across different environments.

### 5. Error Handling Pattern
Comprehensive error handling with meaningful error messages passed back through the MCP protocol.

### 6. Documentation Generation Pattern
The server includes a pattern for automatically generating documentation from source code:
- A script parses TypeScript source files to extract tool definitions
- Documentation is generated in markdown format
- Git hooks ensure documentation stays in sync with code
- Special handling for GitHub-compatible anchor links

### 7. Developer Workflow Pattern
The server implements a pattern for streamlined developer workflows:
- Git hooks automatically update documentation on commit
- npm scripts allow easy hook installation
- Consistent formatting and organization of code and documentation

## Component Structure

### Main Components - Modular Architecture
1. **Streamable HTTP Server** (`src/server/streamable-http-server.ts`):
   - Multi-client HTTP endpoint on port 3001
   - Session management with per-request GitLab authentication
   - Health monitoring endpoint for container orchestration
   - CORS support and proper HTTP headers

2. **Tool Definitions** (`src/tools/definitions/`):
   - **Repository Tools** (`repository.ts`) - Project, branch, file operations
   - **Merge Request Tools** (`merge-requests.ts`) - MR management and discussions
   - **Issue Tools** (`issues.ts`) - Issue tracking and management
   - **CI/CD Tools** (`ci-cd.ts`) - Pipeline and variable management
   - **Integration Tools** (`integrations.ts`) - Webhooks and service integrations
   - **User/Group Tools** (`users-groups.ts`) - Access control and administration

3. **Handler Implementation** (`src/tools/handlers/`):
   - **Repository Handlers** (`repository/`) - projects.ts, branches.ts, files.ts
   - **Merge Request Handlers** (`merge-requests/`) - crud.ts, discussions.ts, comments.ts
   - **Issue Handlers** (`issues/`) - crud.ts
   - Domain-specific handler organization with clear separation

4. **Service Managers** (`src/services/managers/`):
   - **IntegrationsManager** - Project integrations and webhooks
   - **CiCdManager** - CI/CD pipelines, variables, and triggers
   - **UsersGroupsManager** - User and group administration
   - Clean dependency injection and interface consistency

5. **Enhanced Documentation System**:
   - **Dynamic generation** from consolidated build outputs
   - **Git hooks** supporting modular tool definition structure
   - **Auto-sync** across multiple definition files

### Data Flow - Enhanced Multi-Client Architecture
1. **HTTP Request Reception**: Multi-client requests received on `/mcp` endpoint
2. **Session Authentication**: Per-request GitLab token extraction and validation
3. **MCP Protocol Processing**: Request routing through Streamable HTTP transport
4. **Tool Registry Lookup**: Tool name mapped to specific handler in modular structure
5. **Domain Handler Execution**: Focused handler executes with injected manager dependencies
6. **GitLab API Integration**: Axios calls with session-specific authentication
7. **Response Formatting**: Standardized MCP response formatting
8. **Session Cleanup**: Automatic session lifecycle management

### Deployment Flow
1. **Multi-stage Docker Build**: Optimized build with distroless runtime
2. **Health Check Integration**: Container orchestration with `/health` endpoint
3. **Resource Management**: CPU and memory limits for production deployment
4. **Port Mapping**: Host port 3001 → container port 3000
5. **Concurrent Client Support**: Multiple AI assistants with independent sessions

## Key Technical Decisions

### MCP SDK 1.7.0 Integration
Using the latest MCP SDK version for improved capabilities and compatibility.

### Proper Capability Configuration
Explicit configuration of server capabilities:
- Tools capability with proper structure
- Resources capability with proper structure
- Clear declaration of supported operations

### TypeScript Implementation
Using TypeScript for type safety and improved developer experience.

### Axios for HTTP
Using axios for HTTP requests to the GitLab API for its robust features and ease of use.

### Environment-Based Configuration
Configuration through environment variables for flexibility and security.

### Streamable HTTP Communication
**Superior transport implementation** using Streamable HTTP for:
- Multi-client concurrent access
- HTTP-based communication (more reliable than stdio)
- Session management with per-client authentication
- Container-friendly deployment with health monitoring
- Better performance and error handling

### Error Handling Strategy
Detailed error handling with appropriate error codes and messages to facilitate troubleshooting.

### Documentation Generation
Automated documentation generation from TypeScript source files:
- Parses tool definitions to extract names, descriptions, and parameters
- Generates markdown documentation organized by category
- Updates documentation through git hooks
- Custom handling for GitHub-compatible anchor links
- Special cases for sections with ampersands and other special characters

### Git Workflow
Git hooks ensure documentation stays in sync with code:
- Pre-commit hook checks for changes to tool definitions
- Documentation is automatically regenerated when needed
- Hooks are versioned in the repository for easy installation
- Only updates documentation when relevant files change

## Integration Points

### MCP Protocol Integration
Implements the Model Context Protocol to communicate with AI assistants.

### GitLab API Integration
Connects to GitLab API v4 for repository and project operations.

### Development Workflow Integration
Integrates with git hooks for automated documentation updates.

### GitHub Markdown Integration
Ensures compatibility with GitHub's markdown rendering and anchor link conventions.

## Future Architecture Considerations
1. Support for webhook callbacks
2. Caching of GitLab API responses
3. Additional authentication methods
4. Expansion to more GitLab API endpoints
5. Automated testing through CI/CD pipelines
