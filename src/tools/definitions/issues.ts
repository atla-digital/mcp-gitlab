/**
 * Issue tool definitions
 */

export const issueToolDefinitions = [
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
    },
    outputSchema: {
      type: 'object',
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              state: { type: 'string' },
              web_url: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  username: { type: 'string' }
                }
              },
              assignees: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    username: { type: 'string' }
                  }
                }
              },
              labels: {
                type: 'array',
                items: { type: 'string' }
              },
              created_at: { type: 'string' },
              updated_at: { type: 'string' }
            }
          }
        }
      }
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
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
    },
    outputSchema: {
      type: 'object',
      properties: {
        issue: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            description: { type: 'string' },
            state: { type: 'string' },
            web_url: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                username: { type: 'string' }
              }
            },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          }
        }
      }
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false
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
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
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
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true
    }
  },
  {
    name: 'gitlab_list_issue_links',
    description: 'List linked issues for a specific issue',
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
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  },
  {
    name: 'gitlab_create_issue_link',
    description: 'Create a link between two issues (parent-child, blocking, related)',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        issue_iid: {
          type: 'number',
          description: 'The internal ID of the source issue'
        },
        target_project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the target project'
        },
        target_issue_iid: {
          type: 'number',
          description: 'The internal ID of the target issue to link'
        },
        link_type: {
          type: 'string',
          description: 'The type of link relationship',
          enum: ['relates_to', 'blocks', 'is_blocked_by'],
          default: 'relates_to'
        }
      },
      required: ['project_id', 'issue_iid', 'target_project_id', 'target_issue_iid']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false
    }
  },
  {
    name: 'gitlab_delete_issue_link',
    description: 'Remove a link between two issues',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        issue_iid: {
          type: 'number',
          description: 'The internal ID of the source issue'
        },
        issue_link_id: {
          type: 'number',
          description: 'The ID of the issue link to delete'
        }
      },
      required: ['project_id', 'issue_iid', 'issue_link_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false
    }
  },
  {
    name: 'gitlab_list_issue_notes',
    description: 'List all notes/comments on an issue',
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
        sort: {
          type: 'string',
          description: 'Sort order (asc or desc)',
          enum: ['asc', 'desc']
        },
        order_by: {
          type: 'string',
          description: 'Order by created_at or updated_at',
          enum: ['created_at', 'updated_at']
        }
      },
      required: ['project_id', 'issue_iid']
    },
    outputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              body: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  username: { type: 'string' }
                }
              },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              system: { type: 'boolean' },
              noteable_type: { type: 'string' }
            }
          }
        }
      }
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  },
  {
    name: 'gitlab_create_issue_note',
    description: 'Create a new note/comment on an issue',
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
        body: {
          type: 'string',
          description: 'The content of the note/comment (max 1,000,000 characters)'
        }
      },
      required: ['project_id', 'issue_iid', 'body']
    },
    outputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            body: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                username: { type: 'string' }
              }
            },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          }
        }
      }
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false
    }
  },
  {
    name: 'gitlab_get_issue_note',
    description: 'Get a specific note/comment from an issue',
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
        note_id: {
          type: 'number',
          description: 'The ID of the note'
        }
      },
      required: ['project_id', 'issue_iid', 'note_id']
    },
    outputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            body: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                username: { type: 'string' }
              }
            },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            system: { type: 'boolean' }
          }
        }
      }
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  },
  {
    name: 'gitlab_update_issue_note',
    description: 'Update an existing note/comment on an issue',
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
        note_id: {
          type: 'number',
          description: 'The ID of the note to update'
        },
        body: {
          type: 'string',
          description: 'The updated content of the note/comment'
        }
      },
      required: ['project_id', 'issue_iid', 'note_id', 'body']
    },
    outputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            body: { type: 'string' },
            author: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                username: { type: 'string' }
              }
            },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          }
        }
      }
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true
    }
  },
  {
    name: 'gitlab_delete_issue_note',
    description: 'Delete a note/comment from an issue',
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
        note_id: {
          type: 'number',
          description: 'The ID of the note to delete'
        }
      },
      required: ['project_id', 'issue_iid', 'note_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false
    }
  }
];