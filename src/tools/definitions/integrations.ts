/**
 * Integration tool definitions
 */

export const integrationToolDefinitions = [
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
  }
];