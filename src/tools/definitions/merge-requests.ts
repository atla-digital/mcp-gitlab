/**
 * Merge request tool definitions
 */

export const mergeRequestToolDefinitions = [
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
  }
];