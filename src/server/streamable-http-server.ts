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
    
    // Create single transport instance with JSON response support and session management
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(), // Enable session management
      enableJsonResponse: true
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
    let gitlabApiUrl = (req.headers['x-gitlab-url'] as string) || 'https://gitlab.com/api/v4';
    
    if (!gitlabApiToken) {
      return null;
    }

    // Validate and normalize GitLab API URL
    try {
      const url = new URL(gitlabApiUrl);
      const path = url.pathname;
      
      // Check if it already has an API version
      if (path.includes('/api/')) {
        // Extract API version if present
        const apiMatch = path.match(/\/api\/v(\d+)/);
        if (apiMatch) {
          const version = apiMatch[1];
          if (version !== '4') {
            console.error(`Unsupported GitLab API version: v${version}. Only v4 is supported.`);
            return null;
          }
        } else {
          // Has /api/ but no version - invalid
          console.error(`Invalid GitLab API URL: ${gitlabApiUrl}. Expected format: https://domain.com/api/v4`);
          return null;
        }
      } else {
        // No /api/ path, append /api/v4
        gitlabApiUrl = url.origin + '/api/v4';
        console.log(`Auto-appending /api/v4 to GitLab URL: ${gitlabApiUrl}`);
      }
    } catch (error) {
      console.error(`Invalid GitLab API URL: ${gitlabApiUrl}`, error);
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

      // Add request/response logging
      axiosInstance.interceptors.request.use(
        (config) => {
          const maskedToken = gitlabApiToken.substring(0, 8) + '...';
          console.log(`GitLab API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
          console.log(`Headers: PRIVATE-TOKEN: ${maskedToken}`);
          if (config.data) {
            console.log(`Body: ${JSON.stringify(config.data).substring(0, 200)}...`);
          }
          return config;
        },
        (error) => {
          console.error('GitLab API Request Error:', error.message);
          return Promise.reject(error);
        }
      );

      axiosInstance.interceptors.response.use(
        (response) => {
          console.log(`GitLab API Response: ${response.status} ${response.statusText}`);
          return response;
        },
        (error) => {
          if (error.response) {
            console.error(`GitLab API Error: ${error.response.status} ${error.response.statusText}`);
            console.error(`Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
          } else {
            console.error('GitLab API Network Error:', error.message);
          }
          return Promise.reject(error);
        }
      );

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
      console.log(`Created new session: ${gitlabApiToken.substring(0, 8)}... for ${gitlabApiUrl}`);
      const stats = this.getSessionStats();
      console.log(`Total active sessions: ${stats.totalSessions}`);
      return sessionData;
    } catch (error: any) {
      console.error('GitLab authentication failed:', error.response?.data || error.message);
      
      // Check for specific token expiration error
      if (error.response?.data?.error === 'invalid_token' && 
          error.response?.data?.error_description?.includes('expired')) {
        throw new Error('GITLAB_TOKEN_EXPIRED: Your GitLab API token has expired. Please generate a new token and update your configuration.');
      }
      
      // Check for other authentication errors
      if (error.response?.status === 401) {
        throw new Error('GITLAB_TOKEN_INVALID: Invalid GitLab API token. Please check your token and GitLab URL configuration.');
      }
      
      // Generic error for other cases
      throw new Error(`GITLAB_CONNECTION_FAILED: Unable to connect to GitLab API: ${error.message}`);
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

      // Session heartbeat endpoint
      if (req.url === '/heartbeat' && req.method === 'POST') {
        try {
          const sessionData = await this.getSessionData(req);
          if (sessionData) {
            sessionData.lastUsed = new Date();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              status: 'ok', 
              sessionActive: true,
              timestamp: new Date().toISOString() 
            }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              status: 'error',
              sessionActive: false,
              message: 'Session not found' 
            }));
          }
        } catch (error: any) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: 'error',
            sessionActive: false,
            message: error.message || 'Authentication failed' 
          }));
        }
        return;
      }

      // MCP endpoint
      if (req.url === '/mcp') {
        // Read and parse the request body first
        const body = await this.readRequestBody(req);
        const parsedBody = body ? JSON.parse(body) : undefined;
        
        // Try to get session data for GitLab API access
        let sessionData = null;
        try {
          sessionData = await this.getSessionData(req);
        } catch (error: any) {
          // Handle GitLab authentication errors with clear messages
          const errorMessage = error.message || 'Unknown error';
          
          if (errorMessage.startsWith('GITLAB_TOKEN_EXPIRED:')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'gitlab_token_expired',
              message: 'Your GitLab API token has expired. Please generate a new token and update your configuration.',
              details: errorMessage
            }));
            return;
          }
          
          if (errorMessage.startsWith('GITLAB_TOKEN_INVALID:')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'gitlab_token_invalid',
              message: 'Invalid GitLab API token. Please check your token and GitLab URL configuration.',
              details: errorMessage
            }));
            return;
          }
          
          if (errorMessage.startsWith('GITLAB_CONNECTION_FAILED:')) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'gitlab_connection_failed',
              message: 'Unable to connect to GitLab API. Please check your GitLab URL and network connectivity.',
              details: errorMessage
            }));
            return;
          }
          
          // Generic error
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'session_creation_failed',
            message: 'Failed to create GitLab session.',
            details: errorMessage
          }));
          return;
        }
        
        // For non-initialization requests, require GitLab token
        if (!sessionData && parsedBody && parsedBody.method && 
            parsedBody.method !== 'initialize' && 
            parsedBody.method !== 'tools/list' && 
            parsedBody.method !== 'prompts/list') {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'gitlab_token_required',
            message: 'GitLab API token required. Include X-GitLab-Token header with a valid token.'
          }));
          return;
        }

        // Set current session data for handlers to use
        this.currentSessionData = sessionData;

        // Handle the MCP request through the transport with parsed body
        await this.transport.handleRequest(req, res, parsedBody);
        
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
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionCount = this.sessions.size;
    let cleanedCount = 0;

    for (const [sessionKey, session] of this.sessions) {
      if (now.getTime() - session.lastUsed.getTime() > maxAge) {
        const sessionAge = Math.floor((now.getTime() - session.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`Cleaning up inactive session: ${sessionKey.split(':')[0].substring(0, 8)}... (inactive for ${sessionAge} days)`);
        this.sessions.delete(sessionKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Session cleanup completed: removed ${cleanedCount} sessions, ${sessionCount - cleanedCount} sessions remaining`);
    }
  }

  private getSessionStats(): { totalSessions: number, oldestSession: string | null } {
    if (this.sessions.size === 0) {
      return { totalSessions: 0, oldestSession: null };
    }

    let oldestTime = new Date();
    let oldestSessionKey = '';

    for (const [sessionKey, session] of this.sessions) {
      if (session.lastUsed < oldestTime) {
        oldestTime = session.lastUsed;
        oldestSessionKey = sessionKey.split(':')[0].substring(0, 8) + '...';
      }
    }

    const ageInHours = Math.floor((new Date().getTime() - oldestTime.getTime()) / (1000 * 60 * 60));
    return { 
      totalSessions: this.sessions.size, 
      oldestSession: `${oldestSessionKey} (${ageInHours}h ago)` 
    };
  }

  async start(): Promise<void> {
    // Connect server to transport (transport starts automatically)
    await this.server.connect(this.transport);

    // Set up cleanup and monitoring intervals
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
      const stats = this.getSessionStats();
      if (stats.totalSessions > 0) {
        console.log(`Active sessions: ${stats.totalSessions}, oldest: ${stats.oldestSession}`);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Start HTTP server
    const { createServer } = await import('http');
    this.httpServer = createServer((req, res) => this.handleRequest(req, res));

    return new Promise((resolve, reject) => {
      this.httpServer!.listen(this.port, () => {
        console.log(`GitLab MCP Streamable HTTP server running on port ${this.port}`);
        console.log(`Health endpoint: http://localhost:${this.port}/health`);
        console.log(`Heartbeat endpoint: http://localhost:${this.port}/heartbeat`);
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