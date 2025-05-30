/**
 * Tool definitions for GitLab MCP Server
 */

export const toolDefinitions = [
  // Repository tools
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
    name: 'gitlab_list_merge_requests',
    description: 'List merge requests in a GitLab project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        state: {
          type: 'string',
          description: 'Return merge requests with specified state (opened, closed, locked, merged)',
          enum: ['opened', 'closed', 'locked', 'merged']
        },
        scope: {
          type: 'string',
          description: 'Return merge requests for the specified scope (created_by_me, assigned_to_me, all)',
          enum: ['created_by_me', 'assigned_to_me', 'all']
        }
      },
      required: ['project_id']
    }
  },
  {
    name: 'gitlab_get_merge_request',
    description: 'Get details of a specific merge request including commit SHAs, branch names, and metadata. IMPORTANT: This tool provides the diff_refs object containing base_sha, head_sha, and start_sha needed for creating line-specific comments with gitlab_create_merge_request_discussion.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests results as "iid" field)'
        }
      },
      required: ['project_id', 'merge_request_iid']
    }
  },
  {
    name: 'gitlab_get_merge_request_changes',
    description: 'Get changes (diff) of a specific merge request showing all modified files and their diffs. IMPORTANT: This tool provides file paths (old_path/new_path) needed for creating line-specific comments. Use this to understand what files were changed and their content for code review.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field)'
        }
      },
      required: ['project_id', 'merge_request_iid']
    }
  },
  {
    name: 'gitlab_create_merge_request_note',
    description: 'Add a comment to a merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request'
        },
        body: {
          type: 'string',
          description: 'The content of the note/comment'
        }
      },
      required: ['project_id', 'merge_request_iid', 'body']
    }
  },
  {
    name: 'gitlab_create_merge_request_note_internal',
    description: 'Add a comment to a merge request with option to make it an internal note',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request'
        },
        body: {
          type: 'string',
          description: 'The content of the note/comment'
        },
        internal: {
          type: 'boolean',
          description: 'If true, the note will be marked as an internal note visible only to project members'
        }
      },
      required: ['project_id', 'merge_request_iid', 'body']
    }
  },
  {
    name: 'gitlab_list_merge_request_discussions',
    description: 'List all discussions (threaded comments) on a merge request. Use this to see existing code review comments, line-specific discussions, and general merge request conversations.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field)'
        }
      },
      required: ['project_id', 'merge_request_iid']
    }
  },
  {
    name: 'gitlab_get_merge_request_discussion',
    description: 'Get a specific discussion thread on a merge request with all its replies. Use this to read the full conversation thread for a specific code review comment.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field)'
        },
        discussion_id: {
          type: 'string',
          description: 'The ID of the discussion to fetch (get this from gitlab_list_merge_request_discussions as "id" field)'
        }
      },
      required: ['project_id', 'merge_request_iid', 'discussion_id']
    }
  },
  {
    name: 'gitlab_create_merge_request_discussion',
    description: 'Create a new discussion thread on a merge request with optional line-specific positioning for code reviews. Supports single-line comments, multi-line comments, and code suggestions. To create line-specific comments, you must provide the position object with commit SHAs from the merge request.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field)'
        },
        body: {
          type: 'string',
          description: 'The content of the discussion. For code suggestions, use GitLab\'s suggestion syntax: ````suggestion:-0+1\\nsuggested code here\\n````'
        },
        position: {
          type: 'object',
          description: 'Position object for line-specific comments. Omit this property to create a general discussion comment. All SHA values can be obtained from gitlab_get_merge_request under the "diff_refs" object.',
          properties: {
            base_sha: {
              type: 'string',
              description: 'Base commit SHA - get this from gitlab_get_merge_request response: diff_refs.base_sha (the target branch commit)'
            },
            head_sha: {
              type: 'string',
              description: 'Head commit SHA - get this from gitlab_get_merge_request response: diff_refs.head_sha (the source branch latest commit)'
            },
            start_sha: {
              type: 'string',
              description: 'Start commit SHA - typically same as base_sha. Use diff_refs.start_sha from gitlab_get_merge_request response'
            },
            old_path: {
              type: 'string',
              description: 'File path before changes (use same as new_path if file was not renamed). Get file paths from gitlab_get_merge_request_changes'
            },
            new_path: {
              type: 'string',
              description: 'File path after changes (the current file path). Get file paths from gitlab_get_merge_request_changes'
            },
            position_type: {
              type: 'string',
              enum: ['text'],
              description: 'Position type - always use "text" for line comments'
            },
            old_line: {
              type: 'number',
              description: 'Line number in old file (for removed or unchanged lines). Use null for added lines. For unchanged lines, provide both old_line and new_line.'
            },
            new_line: {
              type: 'number',
              description: 'Line number in new file (for added or unchanged lines). Use null for removed lines. For unchanged lines, provide both old_line and new_line.'
            },
            start_line: {
              type: 'number',
              description: 'Starting line number for multi-line comments (use instead of new_line/old_line for multi-line spans). When provided, end_line is required.'
            },
            end_line: {
              type: 'number',
              description: 'Ending line number for multi-line comments (required when start_line is provided). The comment will span from start_line to end_line.'
            }
          },
          required: ['base_sha', 'head_sha', 'start_sha', 'old_path', 'new_path', 'position_type']
        }
      },
      required: ['project_id', 'merge_request_iid', 'body']
    }
  },
  {
    name: 'gitlab_reply_to_discussion',
    description: 'Add a reply to an existing discussion thread. Use this to continue conversations started with gitlab_create_merge_request_discussion.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field)'
        },
        discussion_id: {
          type: 'string',
          description: 'The ID of the discussion to reply to (get this from gitlab_list_merge_request_discussions or the response from gitlab_create_merge_request_discussion as "id" field)'
        },
        body: {
          type: 'string',
          description: 'The content of the reply. Supports markdown formatting and GitLab features like @mentions and issue references.'
        }
      },
      required: ['project_id', 'merge_request_iid', 'discussion_id', 'body']
    }
  },
  {
    name: 'gitlab_resolve_discussion',
    description: 'Resolve or unresolve a discussion thread. Use this to mark code review comments as addressed or to reopen discussions for further review.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project (same as used in other GitLab tools)'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field)'
        },
        discussion_id: {
          type: 'string',
          description: 'The ID of the discussion to resolve/unresolve (get this from gitlab_list_merge_request_discussions as "id" field)'
        },
        resolved: {
          type: 'boolean',
          description: 'Whether to resolve (true) or unresolve (false) the discussion. Resolve when issues are fixed, unresolve to reopen for review.'
        }
      },
      required: ['project_id', 'merge_request_iid', 'discussion_id', 'resolved']
    }
  },
  {
    name: 'gitlab_create_merge_request',
    description: 'Create a new merge request in a GitLab project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        source_branch: {
          type: 'string',
          description: 'The source branch'
        },
        target_branch: {
          type: 'string',
          description: 'The target branch'
        },
        title: {
          type: 'string',
          description: 'The title of the merge request'
        },
        description: {
          type: 'string',
          description: 'The description of the merge request'
        },
        assignee_id: {
          type: 'number',
          description: 'ID of the user to assign the merge request to'
        },
        assignee_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'IDs of users to assign the merge request to'
        },
        reviewer_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'IDs of users to assign as reviewers'
        },
        target_project_id: {
          type: 'string',
          description: 'The target project ID (for cross-project merge requests)'
        },
        labels: {
          type: 'string',
          description: 'Comma-separated list of label names'
        },
        milestone_id: {
          type: 'number',
          description: 'The ID of a milestone'
        },
        remove_source_branch: {
          type: 'boolean',
          description: 'Whether to remove the source branch when merging'
        },
        allow_collaboration: {
          type: 'boolean',
          description: 'Allow commits from members who can merge to the target branch'
        },
        squash: {
          type: 'boolean',
          description: 'Squash commits into a single commit when merging'
        }
      },
      required: ['project_id', 'source_branch', 'target_branch', 'title']
    }
  },
  {
    name: 'gitlab_update_merge_request',
    description: 'Update a merge request title and description',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request'
        },
        title: {
          type: 'string',
          description: 'The title of the merge request'
        },
        description: {
          type: 'string',
          description: 'The description of the merge request'
        }
      },
      required: ['project_id', 'merge_request_iid']
    }
  },
  {
    name: 'gitlab_list_issues',
    description: 'List issues in a GitLab project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        state: {
          type: 'string',
          description: 'Return issues with specified state (opened, closed)',
          enum: ['opened', 'closed']
        },
        labels: {
          type: 'string',
          description: 'Comma-separated list of label names'
        }
      },
      required: ['project_id']
    }
  },
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
        },
        description: {
          type: 'string',
          description: 'The description of the issue'
        },
        labels: {
          type: 'string',
          description: 'Comma-separated list of label names'
        },
        assignee_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'IDs of users to assign the issue to'
        },
        confidential: {
          type: 'boolean',
          description: 'Whether the issue should be confidential'
        }
      },
      required: ['project_id', 'title']
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
    name: 'gitlab_get_issue',
    description: 'Get specific issue details',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        issue_iid: {
          type: 'number',
          description: 'The internal ID of the issue'
        }
      },
      required: ['project_id', 'issue_iid']
    }
  },
  {
    name: 'gitlab_update_issue',
    description: 'Update issue details (assign, labels, status, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        issue_iid: {
          type: 'number',
          description: 'The internal ID of the issue'
        },
        title: {
          type: 'string',
          description: 'The title of the issue'
        },
        description: {
          type: 'string',
          description: 'The description of the issue'
        },
        assignee_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'IDs of users to assign the issue to'
        },
        labels: {
          type: 'string',
          description: 'Comma-separated list of label names'
        },
        state_event: {
          type: 'string',
          description: 'State event (close or reopen)',
          enum: ['close', 'reopen']
        }
      },
      required: ['project_id', 'issue_iid']
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
  },
  
  // Integration tools
  {
    name: 'gitlab_list_integrations',
    description: 'List all available project integrations/services',
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
    name: 'gitlab_get_integration',
    description: 'Get integration details for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        integration: {
          type: 'string',
          description: 'The name of the integration (e.g., slack)'
        }
      },
      required: ['project_id', 'integration']
    }
  },
  {
    name: 'gitlab_update_slack_integration',
    description: 'Update Slack integration settings for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        webhook: {
          type: 'string',
          description: 'The Slack webhook URL'
        },
        username: {
          type: 'string',
          description: 'The Slack username'
        },
        channel: {
          type: 'string',
          description: 'The Slack channel name'
        }
      },
      required: ['project_id', 'webhook']
    }
  },
  {
    name: 'gitlab_disable_slack_integration',
    description: 'Disable Slack integration for a project',
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
    name: 'gitlab_list_webhooks',
    description: 'List webhooks for a project',
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
    name: 'gitlab_get_webhook',
    description: 'Get details of a specific webhook',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        webhook_id: {
          type: 'number',
          description: 'The ID of the webhook'
        }
      },
      required: ['project_id', 'webhook_id']
    }
  },
  {
    name: 'gitlab_add_webhook',
    description: 'Add a new webhook to a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        url: {
          type: 'string',
          description: 'The webhook URL'
        },
        token: {
          type: 'string',
          description: 'Secret token to validate received payloads'
        },
        push_events: {
          type: 'boolean',
          description: 'Trigger webhook for push events'
        },
        issues_events: {
          type: 'boolean',
          description: 'Trigger webhook for issues events'
        },
        merge_requests_events: {
          type: 'boolean',
          description: 'Trigger webhook for merge request events'
        },
        enable_ssl_verification: {
          type: 'boolean',
          description: 'Enable SSL verification for the webhook'
        }
      },
      required: ['project_id', 'url']
    }
  },
  {
    name: 'gitlab_update_webhook',
    description: 'Update an existing webhook',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        webhook_id: {
          type: 'number',
          description: 'The ID of the webhook'
        },
        url: {
          type: 'string',
          description: 'The webhook URL'
        },
        token: {
          type: 'string',
          description: 'Secret token to validate received payloads'
        },
        push_events: {
          type: 'boolean',
          description: 'Trigger webhook for push events'
        },
        issues_events: {
          type: 'boolean',
          description: 'Trigger webhook for issues events'
        },
        merge_requests_events: {
          type: 'boolean',
          description: 'Trigger webhook for merge request events'
        },
        enable_ssl_verification: {
          type: 'boolean',
          description: 'Enable SSL verification for the webhook'
        }
      },
      required: ['project_id', 'webhook_id', 'url']
    }
  },
  {
    name: 'gitlab_delete_webhook',
    description: 'Delete a webhook',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        webhook_id: {
          type: 'number',
          description: 'The ID of the webhook'
        }
      },
      required: ['project_id', 'webhook_id']
    }
  },
  {
    name: 'gitlab_test_webhook',
    description: 'Test a webhook',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        webhook_id: {
          type: 'number',
          description: 'The ID of the webhook'
        }
      },
      required: ['project_id', 'webhook_id']
    }
  },

  // CI/CD tools
  {
    name: 'gitlab_list_pipelines',
    description: 'List pipelines for a project/branch to monitor CI/CD status',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        ref: {
          type: 'string',
          description: 'Filter by branch name'
        },
        status: {
          type: 'string',
          description: 'Filter by pipeline status',
          enum: ['running', 'pending', 'success', 'failed', 'canceled', 'skipped', 'created', 'manual']
        },
        per_page: {
          type: 'number',
          description: 'Number of pipelines to return per page (max 100)'
        }
      },
      required: ['project_id']
    }
  },
  {
    name: 'gitlab_get_pipeline',
    description: 'Get pipeline status and details for monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        pipeline_id: {
          type: 'number',
          description: 'The ID of the pipeline'
        }
      },
      required: ['project_id', 'pipeline_id']
    }
  },
  {
    name: 'gitlab_get_pipeline_jobs',
    description: 'Get jobs within a pipeline to identify failures',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        pipeline_id: {
          type: 'number',
          description: 'The ID of the pipeline'
        },
        scope: {
          type: 'string',
          description: 'Filter by job scope',
          enum: ['created', 'pending', 'running', 'failed', 'success', 'canceled', 'skipped']
        }
      },
      required: ['project_id', 'pipeline_id']
    }
  },
  {
    name: 'gitlab_get_job_log',
    description: 'Get logs for failing jobs to debug issues',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        job_id: {
          type: 'number',
          description: 'The ID of the job'
        }
      },
      required: ['project_id', 'job_id']
    }
  },
  {
    name: 'gitlab_retry_job',
    description: 'Retry failed jobs without retriggering entire pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        job_id: {
          type: 'number',
          description: 'The ID of the job'
        }
      },
      required: ['project_id', 'job_id']
    }
  },
  {
    name: 'gitlab_mark_merge_request_ready',
    description: 'Mark draft MR as ready for review',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request'
        }
      },
      required: ['project_id', 'merge_request_iid']
    }
  },
  {
    name: 'gitlab_merge_merge_request',
    description: 'Merge approved merge requests',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        merge_request_iid: {
          type: 'number',
          description: 'The internal ID of the merge request'
        },
        merge_commit_message: {
          type: 'string',
          description: 'Custom merge commit message'
        },
        squash: {
          type: 'boolean',
          description: 'Squash commits into a single commit when merging'
        },
        should_remove_source_branch: {
          type: 'boolean',
          description: 'Remove source branch after merging'
        }
      },
      required: ['project_id', 'merge_request_iid']
    }
  },
  {
    name: 'gitlab_list_trigger_tokens',
    description: 'List pipeline trigger tokens',
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
    name: 'gitlab_get_trigger_token',
    description: 'Get details of a pipeline trigger token',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        trigger_id: {
          type: 'number',
          description: 'The ID of the trigger'
        }
      },
      required: ['project_id', 'trigger_id']
    }
  },
  {
    name: 'gitlab_create_trigger_token',
    description: 'Create a new pipeline trigger token',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        description: {
          type: 'string',
          description: 'The trigger description'
        }
      },
      required: ['project_id', 'description']
    }
  },
  {
    name: 'gitlab_update_trigger_token',
    description: 'Update a pipeline trigger token',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        trigger_id: {
          type: 'number',
          description: 'The ID of the trigger'
        },
        description: {
          type: 'string',
          description: 'The new trigger description'
        }
      },
      required: ['project_id', 'trigger_id', 'description']
    }
  },
  {
    name: 'gitlab_delete_trigger_token',
    description: 'Delete a pipeline trigger token',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        trigger_id: {
          type: 'number',
          description: 'The ID of the trigger'
        }
      },
      required: ['project_id', 'trigger_id']
    }
  },
  {
    name: 'gitlab_trigger_pipeline',
    description: 'Trigger a pipeline run',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        ref: {
          type: 'string',
          description: 'The branch or tag name to run the pipeline for'
        },
        token: {
          type: 'string',
          description: 'The trigger token'
        },
        variables: {
          type: 'object',
          description: 'Variables to pass to the pipeline',
          additionalProperties: { type: 'string' }
        }
      },
      required: ['project_id', 'ref', 'token']
    }
  },
  {
    name: 'gitlab_list_cicd_variables',
    description: 'List CI/CD variables for a project',
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
    name: 'gitlab_get_cicd_variable',
    description: 'Get a specific CI/CD variable',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        key: {
          type: 'string',
          description: 'The key of the variable'
        }
      },
      required: ['project_id', 'key']
    }
  },
  {
    name: 'gitlab_create_cicd_variable',
    description: 'Create a new CI/CD variable',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        key: {
          type: 'string',
          description: 'The key of the variable'
        },
        value: {
          type: 'string',
          description: 'The value of the variable'
        },
        protected: {
          type: 'boolean',
          description: 'Whether the variable is protected'
        },
        masked: {
          type: 'boolean',
          description: 'Whether the variable is masked'
        }
      },
      required: ['project_id', 'key', 'value']
    }
  },
  {
    name: 'gitlab_update_cicd_variable',
    description: 'Update a CI/CD variable',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        key: {
          type: 'string',
          description: 'The key of the variable'
        },
        value: {
          type: 'string',
          description: 'The value of the variable'
        },
        protected: {
          type: 'boolean',
          description: 'Whether the variable is protected'
        },
        masked: {
          type: 'boolean',
          description: 'Whether the variable is masked'
        }
      },
      required: ['project_id', 'key', 'value']
    }
  },
  {
    name: 'gitlab_delete_cicd_variable',
    description: 'Delete a CI/CD variable',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        key: {
          type: 'string',
          description: 'The key of the variable'
        }
      },
      required: ['project_id', 'key']
    }
  },

  // Users and Groups tools
  {
    name: 'gitlab_list_users',
    description: 'List GitLab users',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search users by username, name or email'
        },
        active: {
          type: 'boolean',
          description: 'Filter users by active status'
        }
      }
    }
  },
  {
    name: 'gitlab_get_current_user',
    description: 'Get details of the currently authenticated user',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'gitlab_get_user',
    description: 'Get details of a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'number',
          description: 'The ID of the user'
        }
      },
      required: ['user_id']
    }
  },
  {
    name: 'gitlab_list_groups',
    description: 'List GitLab groups',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search groups by name'
        },
        owned: {
          type: 'boolean',
          description: 'Limit to groups explicitly owned by the current user'
        }
      }
    }
  },
  {
    name: 'gitlab_get_group',
    description: 'Get details of a specific group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the group'
        }
      },
      required: ['group_id']
    }
  },
  {
    name: 'gitlab_list_group_members',
    description: 'List members of a group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the group'
        }
      },
      required: ['group_id']
    }
  },
  {
    name: 'gitlab_add_group_member',
    description: 'Add a user to a group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the group'
        },
        user_id: {
          type: 'number',
          description: 'The ID of the user'
        },
        access_level: {
          type: 'number',
          description: 'Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)',
          enum: [10, 20, 30, 40, 50]
        }
      },
      required: ['group_id', 'user_id', 'access_level']
    }
  },
  {
    name: 'gitlab_list_project_members',
    description: 'List members of a project',
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
    name: 'gitlab_add_project_member',
    description: 'Add a user to a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        user_id: {
          type: 'number',
          description: 'The ID of the user'
        },
        access_level: {
          type: 'number',
          description: 'Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)',
          enum: [10, 20, 30, 40, 50]
        }
      },
      required: ['project_id', 'user_id', 'access_level']
    }
  }
];

// Export lists of tools by category for easier selection
export const repositoryTools = toolDefinitions.slice(0, 12);
export const integrationTools = toolDefinitions.slice(10, 20);
export const cicdTools = toolDefinitions.slice(20, 31);
export const usersGroupsTools = toolDefinitions.slice(31); 