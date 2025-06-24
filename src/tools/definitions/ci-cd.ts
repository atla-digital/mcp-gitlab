/**
 * CI/CD tool definitions
 */

export const cicdToolDefinitions = [
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
        },
        tail: {
          type: 'number',
          description: 'Only show the last N lines of the log. If not specified, the entire log is returned.'
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
  }
];