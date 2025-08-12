# GitLab MCP Server

A Model Context Protocol (MCP) server that enables you to interact with your GitLab account. Get diffs, analyze merge requests, review code, cherry-pick changes, and more.

## Features

This MCP server provides comprehensive tools for interacting with GitLab repositories, including:

### Core Repository Features
- Listing projects and retrieving details
- Managing branches and repositories
- Working with merge requests and diffs
- Adding comments and internal notes to merge requests
- Updating merge request attributes
- Listing and working with issues
- Getting and comparing repository file contents

### Project Settings & Integrations
- Managing project integrations and services
- Configuring and controlling Slack integration
- Setting up, updating, and testing webhooks

### CI/CD Management
- Working with pipeline trigger tokens
- Managing CI/CD variables
- Triggering and controlling pipelines

### User & Group Administration
- Listing and managing users
- Working with groups and group memberships
- Managing project members and access levels

## Installation

### Option 1: Using Pre-built Docker Image (Recommended)

The easiest way to run the GitLab MCP Server is using the pre-built Docker image:

```bash
# Pull the latest image
docker pull ghcr.io/atla-digital/mcp-gitlab:latest

# Run the container
docker run -d -p 3001:3000 --name mcp-gitlab-server ghcr.io/atla-digital/mcp-gitlab:latest
```

The server will be available at `http://localhost:3001/mcp`

### Option 2: Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  mcp-gitlab:
    image: ghcr.io/atla-digital/mcp-gitlab:latest
    ports:
      - "3001:3000"
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d
```

### Option 3: Building from Source

If you want to build from source or contribute to the project:

#### Prerequisites

- Node.js (v16 or higher)
- npm
- A GitLab account with an API token

#### Setup

1. Clone the repository:

```bash
git clone https://github.com/atla-digital/mcp-gitlab.git
cd mcp-gitlab
```

2. Install dependencies:

```bash
npm install
```

3. Build the server:

```bash
npm run build
```

4. Install git hooks (optional, but recommended for contributors):

```bash
npm run install-hooks
```

This installs a pre-commit hook that automatically regenerates TOOLS.md when src/utils/tools-data.ts changes.

5. Deploy the server:

```bash
docker compose up --build -d
```

The server will be available at `http://localhost:3001/mcp`

### Configuration

This server implements **Streamable HTTP** as the primary MCP transport, which is now natively supported by Claude Code.

#### For Claude Code/Desktop (Recommended)

The easiest way to add the GitLab MCP server is using the Claude CLI:

```bash
# For GitLab.com
claude mcp add sm-gitlab http://host.docker.internal:3001/mcp \
  --transport http \
  --scope user \
  -H "X-GitLab-Token: YOUR_GITLAB_API_TOKEN" \
  -H "X-GitLab-URL: https://gitlab.com"

# For self-hosted GitLab
claude mcp add sm-gitlab http://host.docker.internal:3001/mcp \
  --transport http \
  --scope user \
  -H "X-GitLab-Token: YOUR_GITLAB_API_TOKEN" \
  -H "X-GitLab-URL: https://your-gitlab-instance.com"
```

#### Manual Configuration (Alternative)

Alternatively, you can manually add the following to your MCP settings file (`~/.claude.json`):

```json
{
  "mcpServers": {
    "sm-gitlab": {
      "type": "http",
      "url": "http://host.docker.internal:3001/mcp",
      "headers": {
        "X-GitLab-Token": "YOUR_GITLAB_API_TOKEN",
        "X-GitLab-URL": "https://your-gitlab-instance.com"
      }
    }
  }
}
```

#### Configuration Details

- **`X-GitLab-Token`**: Your GitLab API token (required)
- **`X-GitLab-URL`**: Your GitLab instance URL (optional, defaults to `https://gitlab.com`)

**Important Notes:**
- The server automatically appends `/api/v4` to the GitLab URL if not present
- Only GitLab API v4 is supported
- You can generate a token in your GitLab account under Settings > Access Tokens

**Example GitLab URLs:**
```bash
# For GitLab.com
-H "X-GitLab-URL: https://gitlab.com"

# For self-hosted GitLab
-H "X-GitLab-URL: https://your-gitlab-instance.com"

# Already includes /api/v4 (also works)
-H "X-GitLab-URL: https://gitlab.com/api/v4"
```

#### Environment Configuration

The server supports configuration via environment variables with validation and sensible defaults:

```bash
# Copy the example configuration
cp .env.example .env

# Edit with your values
nano .env
```

**Available Configuration Options:**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `LOG_LEVEL` | Logging level (error/warn/info/http/debug) | `info` |
| `SESSION_MAX_AGE` | Session lifetime in milliseconds | `604800000` (7 days) |
| `SESSION_CLEANUP_INTERVAL` | Session cleanup interval in milliseconds | `300000` (5 minutes) |
| `AXIOS_TIMEOUT` | HTTP request timeout in milliseconds | `30000` (30 seconds) |
| `ENABLE_REQUEST_LOGGING` | Enable detailed API request logging | `true` |
| `ENABLE_DETAILED_ERRORS` | Enable detailed error messages | `false` |

**Example `.env` file:**
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
SESSION_MAX_AGE=604800000
SESSION_CLEANUP_INTERVAL=300000
AXIOS_TIMEOUT=30000
ENABLE_REQUEST_LOGGING=true
ENABLE_DETAILED_ERRORS=false
```

#### Logging & Monitoring

The server features comprehensive structured logging with Winston:

**Log Components:**
- **API Logger**: GitLab API requests and responses
- **Session Logger**: Session creation, cleanup, and lifecycle
- **Server Logger**: HTTP server events and errors
- **Auth Logger**: Authentication and authorization events

**Log Formats:**
- **Console**: Colorized, human-readable format for development
- **Files**: JSON format in production (saved to `logs/` directory)

**Log Level Control:**
Set the `LOG_LEVEL` environment variable to control verbosity:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information, warnings, and errors (default)
- `http`: HTTP requests/responses plus above
- `debug`: Detailed debugging information plus above

**Production Logging:**
```bash
# Set log level for production
LOG_LEVEL=warn NODE_ENV=production npm start

# View logs in production
tail -f logs/combined.log
tail -f logs/error.log
```

### Updating to Latest Version

To update to the latest version when using the pre-built Docker image:

```bash
# Stop the current container
docker stop mcp-gitlab-server
docker rm mcp-gitlab-server

# Pull the latest image
docker pull ghcr.io/atla-digital/mcp-gitlab:latest

# Run with the new image
docker run -d -p 3001:3000 --name mcp-gitlab-server ghcr.io/atla-digital/mcp-gitlab:latest
```

Or if using Docker Compose:

```bash
docker compose pull
docker compose up -d
```

## Available Tools

For a complete list of available tools and their parameters, see [TOOLS.md](./TOOLS.md).

## Example Usage

Here are examples of how to use these tools with AI assistants that support MCP:

### List your projects

```
Could you list my GitLab projects?
```

### Get information about a specific merge request

```
Can you show me the details of merge request with ID 123 in the project 'mygroup/myproject'?
```

### Add a comment to a merge request

```
Please add a comment to merge request 123 in project 'mygroup/myproject' saying "This looks good, but please add more tests."
```

### Add an internal note to a merge request

```
Add an internal note to merge request 123 in project 'mygroup/myproject' that says "Needs security review before merging." Make sure it's only visible to team members.
```

### Update a merge request title and description

```
Update the title of merge request 123 in project 'mygroup/myproject' to "Fix login page performance issues" and update the description to include "This PR addresses the slow loading times on the login page by optimizing database queries."
```

### Compare branches

```
Compare the 'feature-branch' with 'main' in the project 'mygroup/myproject' and show me the differences.
```

## Practical Workflows

### Reviewing a Merge Request

```
1. Show me merge request 123 in project 'mygroup/myproject'
2. Show me the changes for this merge request
3. Add an internal note with my review comments
4. Update the merge request title to better reflect the changes
```

### Project Exploration

```
1. List all my GitLab projects
2. Show me the details of project 'mygroup/myproject'
3. List all branches in this project
4. Show me the content of the README.md file in the main branch
```

## Available Resources

### gitlab://projects

List of GitLab projects accessible with your API token.

## Integration with AI Assistants

The GitLab MCP Server integrates with AI assistants that support the Model Context Protocol (MCP). 

### Capabilities

When connected to an AI assistant, this server enables the assistant to:

1. **View and analyze code**: The assistant can fetch file contents, view branch differences, and examine merge request changes for better code understanding.

2. **Provide code reviews**: The assistant can analyze merge requests and provide feedback through comments or internal notes.

3. **Manage project workflows**: The assistant can update merge request attributes, add comments, and help with repository management tasks.

4. **Explore project structure**: The assistant can browse projects, branches, and files to understand the codebase structure.

5. **Configure CI/CD and integrations**: The assistant can help set up webhooks, manage CI/CD variables, and configure project integrations.

### Getting the Most from AI Assistant Integration

- Be specific when asking about projects, merge requests, or files
- Provide project IDs or paths when possible
- Use the assistant for code review by asking it to analyze specific merge requests
- Have the assistant help with repository configuration and management tasks
- Use internal notes for team-only feedback on merge requests

## License

MIT