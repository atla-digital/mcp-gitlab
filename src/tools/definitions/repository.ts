/**
 * Repository and project tool definitions
 */

export const repositoryToolDefinitions = [
  {
    name: 'gitlab_list_projects',
    description: 'List GitLab projects accessible to the user',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search projects by name'
        },
        owned: {
          type: 'boolean',
          description: 'Limit to projects explicitly owned by the current user'
        },
        membership: {
          type: 'boolean',
          description: 'Limit to projects the current user is a member of'
        },
        per_page: {
          type: 'number',
          description: 'Number of projects to return per page (max 100)'
        }
      }
    }
  },
  {
    name: 'gitlab_get_project',
    description: 'Get details of a specific GitLab project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        }
      },
      required: ['project_id']
    }
  },
  {
    name: 'gitlab_list_branches',
    description: 'List branches of a GitLab project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        search: {
          type: 'string',
          description: 'Search branches by name'
        }
      },
      required: ['project_id']
    }
  },
  {
    name: 'gitlab_get_repository_file',
    description: 'Get content of a file in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        file_path: {
          type: 'string',
          description: 'Path of the file in the repository'
        },
        ref: {
          type: 'string',
          description: 'The name of branch, tag or commit'
        }
      },
      required: ['project_id', 'file_path']
    }
  },
  {
    name: 'gitlab_compare_branches',
    description: 'Compare branches, tags or commits',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        from: {
          type: 'string',
          description: 'The commit SHA or branch name to compare from'
        },
        to: {
          type: 'string',
          description: 'The commit SHA or branch name to compare to'
        }
      },
      required: ['project_id', 'from', 'to']
    }
  },
  {
    name: 'gitlab_get_project_id',
    description: 'Extract GitLab project ID from git remote URL',
    inputSchema: {
      type: 'object',
      properties: {
        remote_url: {
          type: 'string',
          description: 'Git remote URL (e.g., git@gitlab.com:group/project.git or https://gitlab.com/group/project.git)'
        }
      },
      required: ['remote_url']
    }
  },
  {
    name: 'gitlab_create_branch',
    description: 'Create new branch for work packages',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        branch: {
          type: 'string',
          description: 'The name of the new branch'
        },
        ref: {
          type: 'string',
          description: 'The source branch or commit SHA'
        }
      },
      required: ['project_id', 'branch', 'ref']
    }
  },
  {
    name: 'gitlab_delete_branch',
    description: 'Delete a branch',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        branch: {
          type: 'string',
          description: 'The name of the branch to delete'
        }
      },
      required: ['project_id', 'branch']
    }
  }
];