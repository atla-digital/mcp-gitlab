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
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";

// Import manager classes
import { IntegrationsManager, CiCdManager, UsersGroupsManager } from "./services/managers/index.js";

// Import utility modules
import { toolRegistry } from "./utils/tool-registry.js";
import { toolDefinitions } from "./utils/tools-data.js";
import { promptDefinitions, promptTemplates } from "./utils/prompts-data.js";
import { handleListResources, handleReadResource } from "./utils/resource-handlers.js";
import { handleApiError } from "./utils/response-formatter.js";
import { HandlerContext } from "./utils/handler-types.js";

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
  private handlerContext: HandlerContext;

  constructor() {
    // Initialize server with metadata and capabilities
    this.server = new Server(
      {
        name: "mcp-gitlab",
        version: "0.1.0",
      },
      {
        capabilities: {
          canListTools: true,
          canCallTools: true,
          canListResources: true,
          canReadResources: true,
          canListPrompts: true,
          canGetPrompts: true,
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
          completions: {},
          experimental: {}
        }
      }
    );
    
    // Create axios instance with base URL and auth headers
    this.axiosInstance = axios.create({
      baseURL: GITLAB_API_URL,
      headers: {
        'PRIVATE-TOKEN': GITLAB_API_TOKEN
      }
    });

    // Initialize manager classes
    this.integrationsManager = new IntegrationsManager(this.axiosInstance);
    this.ciCdManager = new CiCdManager(this.axiosInstance);
    this.usersGroupsManager = new UsersGroupsManager(this.axiosInstance);

    // Create handler context
    this.handlerContext = {
      axiosInstance: this.axiosInstance,
      integrationsManager: this.integrationsManager,
      ciCdManager: this.ciCdManager,
      usersGroupsManager: this.usersGroupsManager
    };

    // Setup request handlers
    this.setupRequestHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupRequestHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolDefinitions
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return handleListResources(this.axiosInstance);
    });

    // Read GitLab resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return handleReadResource(request.params.uri, this.axiosInstance);
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: promptDefinitions
      };
    });

    // Get specific prompt content
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      const template = promptTemplates[promptName];
      
      if (!template) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${promptName}`);
      }

      let content = template;
      
      // Replace argument placeholders if arguments are provided
      if (request.params.arguments) {
        for (const [key, value] of Object.entries(request.params.arguments)) {
          const placeholder = `{{${key}}}`;
          content = content.replace(new RegExp(placeholder, 'g'), String(value));
        }
      }
      
      // Remove any remaining unused placeholders (especially for optional parameters)
      content = content.replace(/\{\{additional_instructions\}\}\s*/g, '');

      return {
        description: promptDefinitions.find(p => p.name === promptName)?.description || "",
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: content
            }
          }
        ]
      };
    });

    // Call GitLab tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const toolName = request.params.name;
        const handler = toolRegistry[toolName];
        
        if (!handler) {
          throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${toolName}`);
        }
        
        return await handler(request.params, this.handlerContext);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw handleApiError(error, 'Error executing GitLab operation');
      }
    });
  }

  /**
   * Start the GitLab MCP server
   */
  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Create and start the server
const server = new GitLabServer();
server.start().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
}); 