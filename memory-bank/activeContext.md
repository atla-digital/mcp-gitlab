# Active Context: GitLab MCP Server

## Current Focus
The development has achieved a major milestone with a comprehensive **modular architecture refactoring** that significantly improves maintainability and deployment capabilities:

1. **Modular Architecture Implementation**: Successfully broke down monolithic files into focused domain-specific modules
2. **Streamable HTTP Deployment**: Implemented superior Streamable HTTP transport for multi-client support and containerized deployment
3. **Enhanced Developer Workflow**: Advanced git hooks and build processes adapted to the new modular structure
4. **Production-Ready Deployment**: Docker containerization with health checks and resource management

## Recent Major Achievement: Comprehensive Refactoring

### Code Organization Breakthrough
1. **Split massive tools-data.ts (1,396 lines)** into 7 focused definition files:
   - `merge-requests.ts` (417 lines), `ci-cd.ts` (336 lines), `integrations.ts` (225 lines)
   - No single file exceeds 450 lines, dramatically improving maintainability

2. **Decomposed repository-handlers.ts (627 lines)** into 11 domain-specific modules:
   - `repository/projects.ts`, `repository/branches.ts`, `merge-requests/crud.ts`, etc.
   - Clear separation of concerns with focused responsibilities

3. **Reorganized manager classes** into `src/services/managers/` directory:
   - `cicd-manager.ts`, `integrations-manager.ts`, `users-groups-manager.ts`
   - Clean dependency injection and interface consistency

4. **Established new directory structure**:
   - `src/tools/definitions/` - Tool schemas organized by domain
   - `src/tools/handlers/` - Handler implementations by feature
   - `src/services/managers/` - Business logic managers
   - `src/server/` - Server implementations

### Streamable HTTP Implementation
- **Multi-client HTTP server** on port 3001 with `/mcp` endpoint
- **Session management** with GitLab token-based authentication per request
- **Health monitoring** with `/health` endpoint for container orchestration
- **Docker containerization** with multi-stage builds and distroless runtime
- **CORS support** and proper HTTP headers handling

### Build Process Enhancement
- **Updated git hooks** to work with modular structure (watches `src/tools/definitions/`)
- **Enhanced documentation generation** from consolidated build outputs
- **Verified deployment** with all 61 tools functional and accessible

## Recent Changes
- **Completed comprehensive refactoring** breaking down large files into focused modules
- **Implemented Streamable HTTP server** replacing stdio-only communication
- **Added Docker deployment** with health checks and resource limits
- **Enhanced git hooks** to support new modular tool definition structure
- **Updated TOOLS.md generation** to work with consolidated exports from build output
- **Verified all 61 tools** are working correctly in deployed environment
- **Fixed Dockerfile paths** to accommodate new server file location
- **Added session-based authentication** for multi-client support

## Active Decisions

### Auto-generated Documentation
- Created a script that parses the tools-data.ts TypeScript file and generates a markdown table of all tools
- Used regex patterns to extract tool names, descriptions, parameters, and required flags
- Implemented special handling for anchor links with ampersands
- Created a git hook to ensure documentation stays in sync with code

### Git Hook Implementation
- Created a git pre-commit hook that detects changes to tools-data.ts and automatically regenerates TOOLS.md
- Added the hook to both .git/hooks (local) and git-hooks/ (versioned) directories
- Added an npm script for easy installation of the hooks
- Configured the hook to only run when relevant files change to avoid unnecessary processing

### Documentation Organization
- Moved detailed tool documentation from README.md to TOOLS.md
- Organized tools by category in the documentation:
  - Repository Management
  - Integrations & Webhooks
  - CI/CD Management
  - User & Group Management
- Added proper anchors for each section to make navigation easier
- Updated README.md to link to TOOLS.md instead of containing duplicate information

### Anchor Link Handling
- Identified issues with GitHub's anchor link format for sections with special characters
- Implemented hardcoded special cases for sections with ampersands to ensure correct navigation
- Used single-dash format for ampersands (e.g., "User & Group Management" → "#user--group-management")
- Ensured all table of contents links correctly point to their respective sections

### License and Attribution
- Added the MIT license file to clarify the project's licensing
- Updated README.md to acknowledge that this is an extended version of the MCP GitLab server
- Added a link to the original project repository for attribution

## Next Steps

### Short-term Optimization
1. Performance monitoring and optimization of Streamable HTTP endpoints
2. Enhanced logging and observability for production deployment
3. Advanced caching strategies for frequently accessed GitLab resources
4. Unit tests adapted to new modular architecture

### Medium-term Expansion
1. Additional GitLab API coverage (wiki management, repository commits/tags)
2. Advanced webhook callbacks and event handling
3. GraphQL API integration for more efficient data fetching
4. Enhanced resource streaming capabilities

### Long-term Platform Enhancement
1. Multi-instance GitLab server management
2. Advanced authentication methods (OAuth, SSO)
3. Real-time collaboration features
4. Performance analytics and usage metrics

## Open Questions
1. How to handle GitLab API rate limiting effectively?
2. What's the best approach for handling large repository files?
3. How to structure more complex GitLab operations that require multiple API calls?
4. What additional metadata should be provided to AI assistants for better context?

## Current Challenges
1. Ensuring consistent type safety across all GitLab API interactions
2. Managing GitLab API token security
3. Supporting various GitLab API versions and endpoints
4. Handling large responses efficiently within MCP protocol constraints
