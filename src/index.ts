#!/usr/bin/env node

/**
 * GitLab MCP Server
 * 
 * This server provides tools and resources for interacting with GitLab repositories,
 * merge requests, issues, and more through the GitLab API.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import { IntegrationsManager } from "./integrations.js";
import { CiCdManager } from "./ci-cd.js";
import { UsersGroupsManager } from "./users-groups.js";

// Get GitLab API token from environment variables
const GITLAB_API_TOKEN = process.env.GITLAB_API_TOKEN;
const GITLAB_API_URL = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';

if (!GITLAB_API_TOKEN) {
  console.error("GITLAB_API_TOKEN environment variable is required");
  process.exit(1);
}

/**
 * GitLab MCP Server class
 */
class GitLabServer {
  private server: Server;
  private axiosInstance: AxiosInstance;
  private integrationsManager: IntegrationsManager;
  private ciCdManager: CiCdManager;
  private usersGroupsManager: UsersGroupsManager;

  constructor() {
    this.server = new Server(
      {
        name: "mcp-gitlab",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Create axios instance with GitLab API configuration
    this.axiosInstance = axios.create({
      baseURL: GITLAB_API_URL,
      headers: {
        'PRIVATE-TOKEN': GITLAB_API_TOKEN,
        'Content-Type': 'application/json',
      },
    });
    
    // Initialize managers
    this.integrationsManager = new IntegrationsManager(this.axiosInstance);
    this.ciCdManager = new CiCdManager(this.axiosInstance);
    this.usersGroupsManager = new UsersGroupsManager(this.axiosInstance);

    // Set up request handlers
    this.setupResourceHandlers();
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up resource handlers for GitLab resources
   */
  private setupResourceHandlers() {
    // List available GitLab resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: `gitlab://projects`,
            name: `GitLab Projects`,
            mimeType: 'application/json',
            description: 'List of GitLab projects accessible with your API token',
          },
        ],
      };
    });

    // Read GitLab resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      // Handle different resource types
      if (uri === 'gitlab://projects') {
        try {
          const response = await this.axiosInstance.get('/projects', {
            params: { membership: true, per_page: 20 }
          });
          
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new McpError(
              ErrorCode.InternalError,
              `GitLab API error: ${error.response?.data?.message || error.message}`
            );
          }
          throw error;
        }
      }
      
      // Handle project-specific resources
      const projectMatch = uri.match(/^gitlab:\/\/projects\/(\d+)$/);
      if (projectMatch) {
        const projectId = projectMatch[1];
        try {
          const response = await this.axiosInstance.get(`/projects/${projectId}`);
          
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new McpError(
              ErrorCode.InternalError,
              `GitLab API error: ${error.response?.data?.message || error.message}`
            );
          }
          throw error;
        }
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource URI: ${uri}`
      );
    });
  }

  /**
   * Set up tool handlers for GitLab operations
   */
  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Core repository tools
          {
            name: 'gitlab_list_projects',
            description: 'List GitLab projects accessible with your API token',
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
                  description: 'Limit to projects that the current user is a member of'
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
            description: 'Get details of a specific merge request',
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
            name: 'gitlab_get_merge_request_changes',
            description: 'Get changes (diff) of a specific merge request',
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
              required: ['project_id', 'file_path', 'ref']
            }
          },
          {
            name: 'gitlab_compare_branches',
            description: 'Compare branches, tags, or commits',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                from: {
                  type: 'string',
                  description: 'The branch, tag, or commit to compare from'
                },
                to: {
                  type: 'string',
                  description: 'The branch, tag, or commit to compare to'
                }
              },
              required: ['project_id', 'from', 'to']
            }
          },
          
          // Project integrations tools
          {
            name: 'gitlab_list_integrations',
            description: 'List all active integrations for a project',
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
            description: 'Get details of a specific integration',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                integration_slug: {
                  type: 'string',
                  description: 'Slug of the integration (e.g., slack, jira, gitlab-slack-application)'
                }
              },
              required: ['project_id', 'integration_slug']
            }
          },
          {
            name: 'gitlab_update_slack_integration',
            description: 'Update GitLab Slack integration settings',
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
                  description: 'The username to use for Slack notifications'
                },
                channel: {
                  type: 'string',
                  description: 'The default channel to use for notifications'
                },
                notify_only_broken_pipelines: {
                  type: 'boolean',
                  description: 'Send notifications only for broken pipelines'
                },
                notify_only_default_branch: {
                  type: 'boolean',
                  description: 'Send notifications only for the default branch'
                },
                push_events: {
                  type: 'boolean',
                  description: 'Enable notifications for push events'
                },
                issues_events: {
                  type: 'boolean',
                  description: 'Enable notifications for issues events'
                },
                merge_requests_events: {
                  type: 'boolean',
                  description: 'Enable notifications for merge request events'
                },
                tag_push_events: {
                  type: 'boolean',
                  description: 'Enable notifications for tag push events'
                },
                note_events: {
                  type: 'boolean',
                  description: 'Enable notifications for note events'
                },
                pipeline_events: {
                  type: 'boolean',
                  description: 'Enable notifications for pipeline events'
                },
                wiki_page_events: {
                  type: 'boolean',
                  description: 'Enable notifications for wiki page events'
                }
              },
              required: ['project_id', 'webhook']
            }
          },
          {
            name: 'gitlab_disable_slack_integration',
            description: 'Disable GitLab Slack integration',
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
            description: 'List project webhooks',
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
                  description: 'ID of the webhook'
                }
              },
              required: ['project_id', 'webhook_id']
            }
          },
          {
            name: 'gitlab_add_webhook',
            description: 'Add a webhook to a project',
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
                name: {
                  type: 'string',
                  description: 'The webhook name'
                },
                description: {
                  type: 'string',
                  description: 'The webhook description'
                },
                token: {
                  type: 'string',
                  description: 'Secret token to validate received payloads'
                },
                push_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on push events'
                },
                issues_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on issues events'
                },
                merge_requests_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on merge request events'
                },
                tag_push_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on tag push events'
                },
                note_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on note events'
                },
                job_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on job events'
                },
                pipeline_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on pipeline events'
                },
                wiki_page_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on wiki page events'
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
            description: 'Update a project webhook',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                webhook_id: {
                  type: 'number',
                  description: 'ID of the webhook'
                },
                url: {
                  type: 'string',
                  description: 'The webhook URL'
                },
                name: {
                  type: 'string',
                  description: 'The webhook name'
                },
                description: {
                  type: 'string',
                  description: 'The webhook description'
                },
                token: {
                  type: 'string',
                  description: 'Secret token to validate received payloads'
                },
                push_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on push events'
                },
                issues_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on issues events'
                },
                merge_requests_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on merge request events'
                },
                tag_push_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on tag push events'
                },
                note_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on note events'
                },
                job_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on job events'
                },
                pipeline_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on pipeline events'
                },
                wiki_page_events: {
                  type: 'boolean',
                  description: 'Trigger webhook on wiki page events'
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
            description: 'Delete a project webhook',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                webhook_id: {
                  type: 'number',
                  description: 'ID of the webhook'
                }
              },
              required: ['project_id', 'webhook_id']
            }
          },
          {
            name: 'gitlab_test_webhook',
            description: 'Test a project webhook',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                webhook_id: {
                  type: 'number',
                  description: 'ID of the webhook'
                },
                trigger_type: {
                  type: 'string',
                  description: 'Type of trigger to test',
                  enum: ['push_events', 'tag_push_events', 'note_events', 'issues_events', 'merge_requests_events', 'job_events', 'pipeline_events', 'wiki_page_events']
                }
              },
              required: ['project_id', 'webhook_id', 'trigger_type']
            }
          },
          
          // CI/CD tools
          {
            name: 'gitlab_list_trigger_tokens',
            description: 'List pipeline trigger tokens for a project',
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
            description: 'Get details of a specific trigger token',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                trigger_id: {
                  type: 'number',
                  description: 'ID of the trigger token'
                }
              },
              required: ['project_id', 'trigger_id']
            }
          },
          {
            name: 'gitlab_create_trigger_token',
            description: 'Create a new trigger token for a project',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                description: {
                  type: 'string',
                  description: 'Description of the trigger token'
                }
              },
              required: ['project_id', 'description']
            }
          },
          {
            name: 'gitlab_update_trigger_token',
            description: 'Update a trigger token',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                trigger_id: {
                  type: 'number',
                  description: 'ID of the trigger token'
                },
                description: {
                  type: 'string',
                  description: 'New description for the trigger token'
                }
              },
              required: ['project_id', 'trigger_id', 'description']
            }
          },
          {
            name: 'gitlab_delete_trigger_token',
            description: 'Delete a trigger token',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                trigger_id: {
                  type: 'number',
                  description: 'ID of the trigger token'
                }
              },
              required: ['project_id', 'trigger_id']
            }
          },
          {
            name: 'gitlab_trigger_pipeline',
            description: 'Trigger a pipeline with a token',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The ID or URL-encoded path of the project'
                },
                ref: {
                  type: 'string',
                  description: 'Branch or tag name to run the pipeline on'
                },
                token: {
                  type: 'string',
                  description: 'Trigger token or CI/CD job token'
                },
                variables: {
                  type: 'object',
                  description: 'Variables to pass to the pipeline',
                  additionalProperties: {
                    type: 'string'
                  }
                }
              },
              required: ['project_id', 'ref', 'token']
            }
          },
          {
            name: 'gitlab_list_cicd_variables',
            description: 'List project CI/CD variables',
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
                  description: 'Key of the variable'
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
                  description: 'Key of the variable'
                },
                value: {
                  type: 'string',
                  description: 'Value of the variable'
                },
                protected: {
                  type: 'boolean',
                  description: 'Whether the variable is protected'
                },
                masked: {
                  type: 'boolean',
                  description: 'Whether the variable is masked'
                },
                environment_scope: {
                  type: 'string',
                  description: 'The environment scope of the variable'
                },
                variable_type: {
                  type: 'string',
                  description: 'The type of variable',
                  enum: ['env_var', 'file']
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
                  description: 'Key of the variable to update'
                },
                value: {
                  type: 'string',
                  description: 'New value of the variable'
                },
                protected: {
                  type: 'boolean',
                  description: 'Whether the variable is protected'
                },
                masked: {
                  type: 'boolean',
                  description: 'Whether the variable is masked'
                },
                environment_scope: {
                  type: 'string',
                  description: 'The environment scope of the variable'
                },
                variable_type: {
                  type: 'string',
                  description: 'The type of variable',
                  enum: ['env_var', 'file']
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
                  description: 'Key of the variable to delete'
                }
              },
              required: ['project_id', 'key']
            }
          },
          
          // Users and groups tools
          {
            name: 'gitlab_list_users',
            description: 'List users',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Filter users by username'
                },
                search: {
                  type: 'string',
                  description: 'Search users by name, username, or email'
                },
                active: {
                  type: 'boolean',
                  description: 'Filter active users'
                },
                blocked: {
                  type: 'boolean',
                  description: 'Filter blocked users'
                }
              }
            }
          },
          {
            name: 'gitlab_get_user',
            description: 'Get a specific user',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: {
                  type: 'number',
                  description: 'ID of the user'
                }
              },
              required: ['user_id']
            }
          },
          {
            name: 'gitlab_list_groups',
            description: 'List groups',
            inputSchema: {
              type: 'object',
              properties: {
                search: {
                  type: 'string',
                  description: 'Search groups by name'
                },
                owned: {
                  type: 'boolean',
                  description: 'Filter groups owned by the current user'
                },
                min_access_level: {
                  type: 'number',
                  description: 'Filter groups by minimum access level'
                }
              }
            }
          },
          {
            name: 'gitlab_get_group',
            description: 'Get a specific group',
            inputSchema: {
              type: 'object',
              properties: {
                group_id: {
                  type: 'string',
                  description: 'ID or URL-encoded path of the group'
                }
              },
              required: ['group_id']
            }
          },
          {
            name: 'gitlab_list_group_members',
            description: 'List group members',
            inputSchema: {
              type: 'object',
              properties: {
                group_id: {
                  type: 'string',
                  description: 'ID or URL-encoded path of the group'
                }
              },
              required: ['group_id']
            }
          },
          {
            name: 'gitlab_add_group_member',
            description: 'Add a member to a group',
            inputSchema: {
              type: 'object',
              properties: {
                group_id: {
                  type: 'string',
                  description: 'ID or URL-encoded path of the group'
                },
                user_id: {
                  type: 'number',
                  description: 'ID of the user'
                },
                access_level: {
                  type: 'number',
                  description: 'Access level for the user (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)'
                },
                expires_at: {
                  type: 'string',
                  description: 'Expiration date for the membership (YYYY-MM-DD)'
                }
              },
              required: ['group_id', 'user_id', 'access_level']
            }
          },
          {
            name: 'gitlab_list_project_members',
            description: 'List project members',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'ID or URL-encoded path of the project'
                }
              },
              required: ['project_id']
            }
          },
          {
            name: 'gitlab_add_project_member',
            description: 'Add a member to a project',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'ID or URL-encoded path of the project'
                },
                user_id: {
                  type: 'number',
                  description: 'ID of the user'
                },
                access_level: {
                  type: 'number',
                  description: 'Access level for the user (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)'
                },
                expires_at: {
                  type: 'string',
                  description: 'Expiration date for the membership (YYYY-MM-DD)'
                }
              },
              required: ['project_id', 'user_id', 'access_level']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Helper function to format response
        const formatResponse = (data: any) => {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }]
          };
        };

        switch (request.params.name) {
          // Core repository tools
          case 'gitlab_list_projects': {
            const { search, owned, membership, per_page } = request.params.arguments || {};
            const response = await this.axiosInstance.get('/projects', {
              params: {
                search,
                owned: owned === true ? true : undefined,
                membership: membership === true ? true : undefined,
                per_page: per_page || 20
              }
            });
            
            return formatResponse(response.data);
          }

          case 'gitlab_get_project': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(project_id))}`);
            return formatResponse(response.data);
          }

          case 'gitlab_list_branches': {
            const { project_id, search } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/repository/branches`,
              { params: { search } }
            );
            
            return formatResponse(response.data);
          }

          case 'gitlab_list_merge_requests': {
            const { project_id, state, scope } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/merge_requests`,
              { params: { state, scope } }
            );
            
            return formatResponse(response.data);
          }

          case 'gitlab_get_merge_request': {
            const { project_id, merge_request_iid } = request.params.arguments || {};
            if (!project_id || !merge_request_iid) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}`
            );
            
            return formatResponse(response.data);
          }

          case 'gitlab_get_merge_request_changes': {
            const { project_id, merge_request_iid } = request.params.arguments || {};
            if (!project_id || !merge_request_iid) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/changes`
            );
            
            return formatResponse(response.data);
          }

          case 'gitlab_create_merge_request_note': {
            const { project_id, merge_request_iid, body } = request.params.arguments || {};
            if (!project_id || !merge_request_iid || !body) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, and body are required');
            }
            
            const response = await this.axiosInstance.post(
              `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/notes`,
              { body }
            );
            
            return formatResponse(response.data);
          }

          case 'gitlab_list_issues': {
            const { project_id, state, labels } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/issues`,
              { params: { state, labels } }
            );
            
            return formatResponse(response.data);
          }

          case 'gitlab_get_repository_file': {
            const { project_id, file_path, ref } = request.params.arguments || {};
            if (!project_id || !file_path || !ref) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, file_path, and ref are required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/repository/files/${encodeURIComponent(String(file_path))}`,
              { params: { ref } }
            );
            
            // GitLab returns file content as base64, decode it
            const content = response.data.content;
            const decodedContent = Buffer.from(content, 'base64').toString('utf-8');
            
            return {
              content: [{
                type: 'text',
                text: decodedContent
              }]
            };
          }

          case 'gitlab_compare_branches': {
            const { project_id, from, to } = request.params.arguments || {};
            if (!project_id || !from || !to) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, from, and to are required');
            }
            
            const response = await this.axiosInstance.get(
              `/projects/${encodeURIComponent(String(project_id))}/repository/compare`,
              { params: { from, to } }
            );
            
            return formatResponse(response.data);
          }

          // Project integrations tools
          case 'gitlab_list_integrations': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) { throw new McpError(ErrorCode.InvalidParams, 'project_id is required'); }
            const data = await this.integrationsManager.listIntegrations(project_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_get_integration': {
            const { project_id, integration_slug } = request.params.arguments || {};
            if (!project_id || !integration_slug) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and integration_slug are required');
            }
            
            const data = await this.integrationsManager.getIntegration(project_id as string | number, integration_slug as string);
            return formatResponse(data);
          }

          case 'gitlab_update_slack_integration': {
            const { project_id, ...options } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const data = await this.integrationsManager.updateSlackIntegration(project_id as string | number, options);
            return formatResponse(data);
          }

          case 'gitlab_disable_slack_integration': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const data = await this.integrationsManager.disableSlackIntegration(project_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_list_webhooks': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const data = await this.integrationsManager.listWebhooks(project_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_get_webhook': {
            const { project_id, webhook_id } = request.params.arguments || {};
            if (!project_id || !webhook_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and webhook_id are required');
            }
            
            const data = await this.integrationsManager.getWebhook(project_id as string | number, webhook_id as number);
            return formatResponse(data);
          }

          case 'gitlab_add_webhook': {
            const { project_id, ...options } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            if (!options.url) {
              throw new McpError(ErrorCode.InvalidParams, 'url is required for webhook');
            }
            
            const data = await this.integrationsManager.addWebhook(project_id as string | number, options as {
              url: string;
              name?: string;
              description?: string;
              token?: string;
              push_events?: boolean;
              push_events_branch_filter?: string;
              issues_events?: boolean;
              confidential_issues_events?: boolean;
              merge_requests_events?: boolean;
              tag_push_events?: boolean;
              note_events?: boolean;
              confidential_note_events?: boolean;
              job_events?: boolean;
              pipeline_events?: boolean;
              wiki_page_events?: boolean;
              deployment_events?: boolean;
              releases_events?: boolean;
              feature_flag_events?: boolean;
              enable_ssl_verification?: boolean;
              custom_webhook_template?: string;
              custom_headers?: Array<{key: string; value?: string}>;
            });
            return formatResponse(data);
          }

          case 'gitlab_update_webhook': {
            const { project_id, webhook_id, ...options } = request.params.arguments || {};
            if (!project_id || !webhook_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and webhook_id are required');
            }
            
            if (!options.url) {
              throw new McpError(ErrorCode.InvalidParams, 'url is required for webhook');
            }
            
            const data = await this.integrationsManager.updateWebhook(project_id as string | number, webhook_id as number, options as {
              url: string;
              name?: string;
              description?: string;
              token?: string;
              push_events?: boolean;
              push_events_branch_filter?: string;
              issues_events?: boolean;
              confidential_issues_events?: boolean;
              merge_requests_events?: boolean;
              tag_push_events?: boolean;
              note_events?: boolean;
              confidential_note_events?: boolean;
              job_events?: boolean;
              pipeline_events?: boolean;
              wiki_page_events?: boolean;
              deployment_events?: boolean;
              releases_events?: boolean;
              feature_flag_events?: boolean;
              enable_ssl_verification?: boolean;
              custom_webhook_template?: string;
              custom_headers?: Array<{key: string; value?: string}>;
            });
            return formatResponse(data);
          }

          case 'gitlab_delete_webhook': {
            const { project_id, webhook_id } = request.params.arguments || {};
            if (!project_id || !webhook_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and webhook_id are required');
            }
            
            const data = await this.integrationsManager.deleteWebhook(project_id as string | number, webhook_id as number);
            return formatResponse(data);
          }

          case 'gitlab_test_webhook': {
            const { project_id, webhook_id, trigger_type } = request.params.arguments || {};
            if (!project_id || !webhook_id || !trigger_type) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, webhook_id, and trigger_type are required');
            }
            
            const data = await this.integrationsManager.testWebhook(project_id as string | number, webhook_id as number, trigger_type as string);
            return formatResponse(data);
          }

          // CI/CD tools
          case 'gitlab_list_trigger_tokens': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const data = await this.ciCdManager.listTriggerTokens(project_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_get_trigger_token': {
            const { project_id, trigger_id } = request.params.arguments || {};
            if (!project_id || !trigger_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and trigger_id are required');
            }
            
            const data = await this.ciCdManager.getTriggerToken(project_id as string | number, trigger_id as number);
            return formatResponse(data);
          }

          case 'gitlab_create_trigger_token': {
            const { project_id, description } = request.params.arguments || {};
            if (!project_id || !description) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and description are required');
            }
            
            const data = await this.ciCdManager.createTriggerToken(project_id as string | number, description as string);
            return formatResponse(data);
          }

          case 'gitlab_update_trigger_token': {
            const { project_id, trigger_id, description } = request.params.arguments || {};
            if (!project_id || !trigger_id || !description) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, trigger_id, and description are required');
            }
            
            const data = await this.ciCdManager.updateTriggerToken(project_id as string | number, trigger_id as number, description as string);
            return formatResponse(data);
          }

          case 'gitlab_delete_trigger_token': {
            const { project_id, trigger_id } = request.params.arguments || {};
            if (!project_id || !trigger_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and trigger_id are required');
            }
            
            const data = await this.ciCdManager.deleteTriggerToken(project_id as string | number, trigger_id as number);
            return formatResponse(data);
          }

          case 'gitlab_trigger_pipeline': {
            const { project_id, ref, token, variables } = request.params.arguments || {};
            if (!project_id || !ref || !token) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, ref, and token are required');
            }
            
            const data = await this.ciCdManager.triggerPipeline(project_id as string | number, ref as string, token as string, variables as Record<string, string> | undefined);
            return formatResponse(data);
          }

          case 'gitlab_list_cicd_variables': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const data = await this.ciCdManager.listCiCdVariables(project_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_get_cicd_variable': {
            const { project_id, key } = request.params.arguments || {};
            if (!project_id || !key) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and key are required');
            }
            
            const data = await this.ciCdManager.getCiCdVariable(project_id as string | number, key as string);
            return formatResponse(data);
          }

          case 'gitlab_create_cicd_variable': {
            const { project_id, key, value, ...options } = request.params.arguments || {};
            if (!project_id || !key || !value) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, key, and value are required');
            }
            
            const data = await this.ciCdManager.createCiCdVariable(project_id as string | number, { key: key as string, value: value as string, ...options });
            return formatResponse(data);
          }

          case 'gitlab_update_cicd_variable': {
            const { project_id, key, value, ...options } = request.params.arguments || {};
            if (!project_id || !key || !value) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, key, and value are required');
            }
            
            const data = await this.ciCdManager.updateCiCdVariable(project_id as string | number, key as string, { value: value as string, ...options });
            return formatResponse(data);
          }

          case 'gitlab_delete_cicd_variable': {
            const { project_id, key } = request.params.arguments || {};
            if (!project_id || !key) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id and key are required');
            }
            
            const data = await this.ciCdManager.deleteCiCdVariable(project_id as string | number, key as string);
            return formatResponse(data);
          }

          // Users and groups tools
          case 'gitlab_list_users': {
            const options = request.params.arguments || {};
            const data = await this.usersGroupsManager.listUsers(options);
            return formatResponse(data);
          }

          case 'gitlab_get_user': {
            const { user_id } = request.params.arguments || {};
            if (!user_id) {
              throw new McpError(ErrorCode.InvalidParams, 'user_id is required');
            }
            
            const data = await this.usersGroupsManager.getUser(user_id as number);
            return formatResponse(data);
          }

          case 'gitlab_list_groups': {
            const options = request.params.arguments || {};
            const data = await this.usersGroupsManager.listGroups(options);
            return formatResponse(data);
          }

          case 'gitlab_get_group': {
            const { group_id } = request.params.arguments || {};
            if (!group_id) {
              throw new McpError(ErrorCode.InvalidParams, 'group_id is required');
            }
            
            const data = await this.usersGroupsManager.getGroup(group_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_list_group_members': {
            const { group_id } = request.params.arguments || {};
            if (!group_id) {
              throw new McpError(ErrorCode.InvalidParams, 'group_id is required');
            }
            
            const data = await this.usersGroupsManager.listGroupMembers(group_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_add_group_member': {
            const { group_id, user_id, access_level, expires_at } = request.params.arguments || {};
            if (!group_id || !user_id || !access_level) {
              throw new McpError(ErrorCode.InvalidParams, 'group_id, user_id, and access_level are required');
            }
            
            const data = await this.usersGroupsManager.addGroupMember(group_id as string | number, user_id as number, access_level as number, expires_at as string | undefined);
            return formatResponse(data);
          }

          case 'gitlab_list_project_members': {
            const { project_id } = request.params.arguments || {};
            if (!project_id) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
            }
            
            const data = await this.usersGroupsManager.listProjectMembers(project_id as string | number);
            return formatResponse(data);
          }

          case 'gitlab_add_project_member': {
            const { project_id, user_id, access_level, expires_at } = request.params.arguments || {};
            if (!project_id || !user_id || !access_level) {
              throw new McpError(ErrorCode.InvalidParams, 'project_id, user_id, and access_level are required');
            }
            
            const data = await this.usersGroupsManager.addProjectMember(project_id as string | number, user_id as number, access_level as number, expires_at as string | undefined);
            return formatResponse(data);
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [{
              type: 'text',
              text: `GitLab API error: ${error.response?.data?.message || error.message}`
            }],
            isError: true
          };
        }
        throw error;
      }
    });
  }

  /**
   * Start the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitLab MCP server running on stdio');
  }
}

// Create and start the server
const server = new GitLabServer();
server.run().catch(console.error);
