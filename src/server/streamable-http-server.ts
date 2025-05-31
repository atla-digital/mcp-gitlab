#!/usr/bin/env node
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
import { randomUUID } from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { IncomingMessage, ServerResponse } from 'http';
import { IntegrationsManager, CiCdManager, UsersGroupsManager } from '../services/managers/index.js';
import { toolRegistry } from "../utils/tool-registry.js";
import { toolDefinitions } from "../utils/tools-data.js";
import { promptDefinitions, promptTemplates } from "../utils/prompts-data.js";
import { handleListResources, handleReadResource } from "../utils/resource-handlers.js";
import { handleApiError } from "../utils/response-formatter.js";
import type { HandlerContext } from '../utils/handler-types.js';

interface SessionData {
  gitlabApiToken: string;
  gitlabApiUrl: string;
  handlerContext: HandlerContext;
  lastUsed: Date;
}

class GitLabStreamableHttpServer {
  private server: Server;
  private transport: StreamableHTTPServerTransport;
  private httpServer?: any;
  private sessions = new Map<string, SessionData>();
  private cleanupInterval?: NodeJS.Timeout;
  private port: number;
  private currentSessionData: SessionData | null = null;

  constructor(port: number = 3000) {
    this.port = port;
    
    // Create single transport instance with stateless mode (no session validation)
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Disable session management
      enableJsonResponse: false
    });

    // Create single server instance
    this.server = new Server(
      {
        name: "mcp-gitlab",
        version: "0.1.0"
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
          resources: { listChanged: false },
          prompts: { listChanged: false }
        }
      }
    );

    this.setupMCPHandlers();
  }

  /**
   * Extract session data from request headers
   */
  private async getSessionData(req: IncomingMessage): Promise<SessionData | null> {
    const gitlabApiToken = req.headers['x-gitlab-token'] as string;
    const gitlabApiUrl = (req.headers['x-gitlab-url'] as string) || 'https://gitlab.com/api/v4';
    
    if (!gitlabApiToken) {
      return null;
    }

    // Use token+url as session key
    const sessionKey = `${gitlabApiToken}:${gitlabApiUrl}`;
    
    if (this.sessions.has(sessionKey)) {
      const session = this.sessions.get(sessionKey)!;
      session.lastUsed = new Date();
      return session;
    }

    // Create new session data
    try {
      const axiosInstance = axios.create({
        baseURL: gitlabApiUrl,
        headers: { 'PRIVATE-TOKEN': gitlabApiToken }
      });

      // Test GitLab connection
      await axiosInstance.get('/user');

      const integrationsManager = new IntegrationsManager(axiosInstance);
      const ciCdManager = new CiCdManager(axiosInstance);
      const usersGroupsManager = new UsersGroupsManager(axiosInstance);

      const handlerContext: HandlerContext = {
        axiosInstance,
        integrationsManager,
        ciCdManager,
        usersGroupsManager
      };

      const sessionData: SessionData = {
        gitlabApiToken,
        gitlabApiUrl,
        handlerContext,
        lastUsed: new Date()
      };

      this.sessions.set(sessionKey, sessionData);
      return sessionData;
    } catch (error: any) {
      console.error('GitLab authentication failed:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Set up MCP request handlers for the server instance
   */
  private setupMCPHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolDefinitions
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
      if (!this.currentSessionData) {
        throw new McpError(ErrorCode.InvalidRequest, 'No active session');
      }
      return handleListResources(this.currentSessionData.handlerContext.axiosInstance);
    });

    // Read GitLab resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      if (!this.currentSessionData) {
        throw new McpError(ErrorCode.InvalidRequest, 'No active session');
      }
      return handleReadResource(request.params.uri, this.currentSessionData.handlerContext.axiosInstance);
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
        if (!this.currentSessionData) {
          throw new McpError(ErrorCode.InvalidRequest, 'No active session');
        }

        const toolName = request.params.name;
        const handler = toolRegistry[toolName];
        
        if (!handler) {
          throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${toolName}`);
        }
        
        return await handler(request.params, this.currentSessionData.handlerContext);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw handleApiError(error, 'Error executing GitLab operation');
      }
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, X-GitLab-Token, X-GitLab-URL');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Health check endpoint
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // MCP endpoint
      if (req.url === '/mcp') {
        // Get session data for GitLab API access
        const sessionData = await this.getSessionData(req);
        
        // For initialization requests, allow without GitLab token
        if (!sessionData && req.method === 'POST') {
          const body = await this.readRequestBody(req);
          const parsedBody = body ? JSON.parse(body) : undefined;
          
          if (!parsedBody || !parsedBody.method || 
              (parsedBody.method !== 'initialize' && 
               parsedBody.method !== 'tools/list' && 
               parsedBody.method !== 'prompts/list')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'GitLab API token required',
              message: 'Include X-GitLab-Token header'
            }));
            return;
          }
        }

        // Set current session data for handlers to use
        this.currentSessionData = sessionData;

        // Handle the MCP request through the transport
        await this.transport.handleRequest(req, res);
        
        // Clear current session data
        this.currentSessionData = null;
        return;
      }

      // 404 for other paths
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error: any) {
      console.error('Request handling error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    } finally {
      // Always clear current session data
      this.currentSessionData = null;
    }
  }

  private async readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', reject);
    });
  }

  private cleanupInactiveSessions(): void {
    const now = new Date();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [sessionKey, session] of this.sessions) {
      if (now.getTime() - session.lastUsed.getTime() > maxAge) {
        console.log(`Cleaning up inactive session: ${sessionKey.split(':')[0].substring(0, 8)}...`);
        this.sessions.delete(sessionKey);
      }
    }
  }

  async start(): Promise<void> {
    // Connect server to transport (transport starts automatically)
    await this.server.connect(this.transport);

    // Set up cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Start HTTP server
    const { createServer } = await import('http');
    this.httpServer = createServer((req, res) => this.handleRequest(req, res));

    return new Promise((resolve, reject) => {
      this.httpServer!.listen(this.port, () => {
        console.log(`GitLab MCP Streamable HTTP server running on port ${this.port}`);
        console.log(`Health endpoint: http://localhost:${this.port}/health`);
        console.log(`MCP endpoint: http://localhost:${this.port}/mcp`);
        resolve();
      });

      this.httpServer!.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clear all sessions
    this.sessions.clear();

    // Close transport
    await this.transport.close();

    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(resolve);
      });
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GitLabStreamableHttpServer(parseInt(process.env.PORT || '3000'));
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}