# GitLab MCP Server

A Model Context Protocol (MCP) server that enables you to interact with your GitLab account. Get diffs, analyze merge requests, review code, cherry-pick changes, and more.

## Features

This MCP server provides tools for interacting with GitLab repositories, including:

- Listing projects
- Getting project details
- Listing branches
- Working with merge requests
- Viewing diffs and changes
- Adding comments to merge requests
- Listing issues
- Getting repository file contents
- Comparing branches, tags, or commits

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm
- A GitLab account with an API token

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mcp-gitlab.git
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

4. Configure your GitLab API token:

You need to provide your GitLab API token in the MCP settings configuration file. The token is used to authenticate with the GitLab API.

For Cursor/Roo Cline, add the following to your MCP settings file (`~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": [
        "/path/to/mcp-gitlab/build/index.js"
      ],
      "env": {
        "GITLAB_API_TOKEN": "YOUR_GITLAB_API_TOKEN",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

For Claude Desktop, add the following to your MCP settings file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": [
        "/path/to/mcp-gitlab/build/index.js"
      ],
      "env": {
        "GITLAB_API_TOKEN": "YOUR_GITLAB_API_TOKEN",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

Replace `YOUR_GITLAB_API_TOKEN` with your actual GitLab API token. You can generate a token in your GitLab account under Settings > Access Tokens.

## Available Tools

### gitlab_list_projects

List GitLab projects accessible with your API token.

Parameters:

- `search` (optional): Search projects by name
- `owned` (optional): Limit to projects explicitly owned by the current user
- `membership` (optional): Limit to projects that the current user is a member of
- `per_page` (optional): Number of projects to return per page (max 100)

### gitlab_get_project

Get details of a specific GitLab project.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project

### gitlab_list_branches

List branches of a GitLab project.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `search` (optional): Search branches by name

### gitlab_list_merge_requests

List merge requests in a GitLab project.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `state` (optional): Return merge requests with specified state (opened, closed, locked, merged)
- `scope` (optional): Return merge requests for the specified scope (created_by_me, assigned_to_me, all)

### gitlab_get_merge_request

Get details of a specific merge request.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `merge_request_iid` (required): The internal ID of the merge request

### gitlab_get_merge_request_changes

Get changes (diff) of a specific merge request.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `merge_request_iid` (required): The internal ID of the merge request

### gitlab_create_merge_request_note

Add a comment to a merge request.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `merge_request_iid` (required): The internal ID of the merge request
- `body` (required): The content of the note/comment

### gitlab_list_issues

List issues in a GitLab project.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `state` (optional): Return issues with specified state (opened, closed)
- `labels` (optional): Comma-separated list of label names

### gitlab_get_repository_file

Get content of a file in a repository.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `file_path` (required): Path of the file in the repository
- `ref` (required): The name of branch, tag or commit

### gitlab_compare_branches

Compare branches, tags, or commits.

Parameters:

- `project_id` (required): The ID or URL-encoded path of the project
- `from` (required): The branch, tag, or commit to compare from
- `to` (required): The branch, tag, or commit to compare to

## Available Resources

### gitlab://projects

List of GitLab projects accessible with your API token.

## License

MIT
