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
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { IncomingMessage, ServerResponse } from 'http';
import {
  IntegrationsManager,
  CiCdManager,
  UsersGroupsManager,
} from '../services/managers/index.js';
import { toolRegistry } from '../utils/tool-registry.js';
import { toolDefinitions } from '../utils/tools-data.js';
import { promptDefinitions, promptTemplates } from '../utils/prompts-data.js';
import { handleListResources, handleReadResource } from '../utils/resource-handlers.js';
import { handleApiError } from '../utils/response-formatter.js';
import type { HandlerContext } from '../utils/handler-types.js';
import { apiLogger, sessionLogger, serverLogger, authLogger } from '../utils/logger.js';

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
      enableJsonResponse: true,
    });

    // Create single server instance
    this.server = new Server(
      {
        name: 'mcp-gitlab',
        version: '0.1.0',
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
          experimental: {},
        },
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
            authLogger.error('Unsupported GitLab API version', { version, supported: 'v4' });
            return null;
          }
        } else {
          // Has /api/ but no version - invalid
          authLogger.error('Invalid GitLab API URL format', {
            url: gitlabApiUrl,
            expected: 'https://domain.com/api/v4',
          });
          return null;
        }
      } else {
        // No /api/ path, append /api/v4
        gitlabApiUrl = url.origin + '/api/v4';
        authLogger.info('Auto-appending /api/v4 to GitLab URL', {
          originalUrl: url.origin,
          finalUrl: gitlabApiUrl,
        });
      }
    } catch (error) {
      authLogger.error('Invalid GitLab API URL', { url: gitlabApiUrl, error });
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
        headers: { 'PRIVATE-TOKEN': gitlabApiToken },
        timeout: 30000, // 30 seconds timeout to prevent hanging connections
      });

      // Add request/response logging
      axiosInstance.interceptors.request.use(
        config => {
          const maskedToken = gitlabApiToken.substring(0, 8) + '...';
          apiLogger.http('GitLab API Request', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            token: maskedToken,
            hasBody: !!config.data,
            bodyPreview: config.data ? JSON.stringify(config.data).substring(0, 100) : undefined,
          });
          return config;
        },
        error => {
          apiLogger.error('GitLab API Request Error', { error: error.message });
          return Promise.reject(error);
        }
      );

      axiosInstance.interceptors.response.use(
        response => {
          apiLogger.http('GitLab API Response', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
          });
          return response;
        },
        error => {
          if (error.response) {
            apiLogger.error('GitLab API Error', {
              status: error.response.status,
              statusText: error.response.statusText,
              url: error.config?.url,
              responsePreview: JSON.stringify(error.response.data).substring(0, 200),
            });
          } else {
            apiLogger.error('GitLab API Network Error', {
              error: error.message,
              url: error.config?.url,
            });
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
        usersGroupsManager,
      };

      const sessionData: SessionData = {
        gitlabApiToken,
        gitlabApiUrl,
        handlerContext,
        lastUsed: new Date(),
      };

      this.sessions.set(sessionKey, sessionData);
      sessionLogger.info('Created new session', {
        tokenPreview: gitlabApiToken.substring(0, 8) + '...',
        gitlabUrl: gitlabApiUrl,
      });
      const stats = this.getSessionStats();
      sessionLogger.info('Session statistics', { totalSessions: stats.totalSessions });
      return sessionData;
    } catch (error: any) {
      authLogger.error('GitLab authentication failed', {
        error: error.response?.data || error.message,
      });

      // Check for specific token expiration error
      if (
        error.response?.data?.error === 'invalid_token' &&
        error.response?.data?.error_description?.includes('expired')
      ) {
        throw new Error(
          'GITLAB_TOKEN_EXPIRED: Your GitLab API token has expired. Please generate a new token and update your configuration.'
        );
      }

      // Check for other authentication errors
      if (error.response?.status === 401) {
        throw new Error(
          'GITLAB_TOKEN_INVALID: Invalid GitLab API token. Please check your token and GitLab URL configuration.'
        );
      }

      // Generic error for other cases
      throw new Error(
        `GITLAB_CONNECTION_FAILED: Unable to connect to GitLab API: ${error.message}`
      );
    }
  }

  /**
   * Set up MCP request handlers for the server instance
   */
  private setupMCPHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolDefinitions,
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      if (!this.currentSessionData) {
        throw new McpError(ErrorCode.InvalidRequest, 'No active session');
      }
      return handleListResources();
    });

    // Read GitLab resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      if (!this.currentSessionData) {
        throw new McpError(ErrorCode.InvalidRequest, 'No active session');
      }
      return handleReadResource(
        request.params.uri,
        this.currentSessionData.handlerContext.axiosInstance
      );
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: promptDefinitions,
      };
    });

    // Get specific prompt content
    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
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
        description: promptDefinitions.find(p => p.name === promptName)?.description || '',
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: content,
            },
          },
        ],
      };
    });

    // Call GitLab tools
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
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
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Accept, Mcp-Session-Id, X-GitLab-Token, X-GitLab-URL'
      );

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
            res.end(
              JSON.stringify({
                status: 'ok',
                sessionActive: true,
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                status: 'error',
                sessionActive: false,
                message: 'Session not found',
              })
            );
          }
        } catch (error: any) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'error',
              sessionActive: false,
              message: error.message || 'Authentication failed',
            })
          );
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
            res.end(
              JSON.stringify({
                error: 'gitlab_token_expired',
                message:
                  'Your GitLab API token has expired. Please generate a new token and update your configuration.',
                details: errorMessage,
              })
            );
            return;
          }

          if (errorMessage.startsWith('GITLAB_TOKEN_INVALID:')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'gitlab_token_invalid',
                message:
                  'Invalid GitLab API token. Please check your token and GitLab URL configuration.',
                details: errorMessage,
              })
            );
            return;
          }

          if (errorMessage.startsWith('GITLAB_CONNECTION_FAILED:')) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'gitlab_connection_failed',
                message:
                  'Unable to connect to GitLab API. Please check your GitLab URL and network connectivity.',
                details: errorMessage,
              })
            );
            return;
          }

          // Generic error
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'session_creation_failed',
              message: 'Failed to create GitLab session.',
              details: errorMessage,
            })
          );
          return;
        }

        // For non-initialization requests, require GitLab token
        if (
          !sessionData &&
          parsedBody &&
          parsedBody.method &&
          parsedBody.method !== 'initialize' &&
          parsedBody.method !== 'tools/list' &&
          parsedBody.method !== 'prompts/list'
        ) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'gitlab_token_required',
              message:
                'GitLab API token required. Include X-GitLab-Token header with a valid token.',
            })
          );
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
      serverLogger.error('Request handling error', { error, url: req.url, method: req.method });
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
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
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

    // Take snapshot of sessions to avoid race condition with concurrent access
    const sessionsSnapshot = Array.from(this.sessions.entries());

    for (const [sessionKey] of sessionsSnapshot) {
      // Re-check if session still exists and is still old (avoid race condition)
      const currentSession = this.sessions.get(sessionKey);
      if (currentSession && now.getTime() - currentSession.lastUsed.getTime() > maxAge) {
        const sessionAge = Math.floor(
          (now.getTime() - currentSession.lastUsed.getTime()) / (1000 * 60 * 60 * 24)
        );
        sessionLogger.info('Cleaning up inactive session', {
          tokenPreview: sessionKey.split(':')[0].substring(0, 8) + '...',
          inactiveDays: sessionAge,
        });
        this.sessions.delete(sessionKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      sessionLogger.info('Session cleanup completed', {
        removedSessions: cleanedCount,
        remainingSessions: sessionCount - cleanedCount,
      });
    }
  }

  private getSessionStats(): { totalSessions: number; oldestSession: string | null } {
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
      oldestSession: `${oldestSessionKey} (${ageInHours}h ago)`,
    };
  }

  async start(): Promise<void> {
    // Connect server to transport (transport starts automatically)
    await this.server.connect(this.transport);

    // Set up cleanup and monitoring intervals
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupInactiveSessions();
        const stats = this.getSessionStats();
        if (stats.totalSessions > 0) {
          sessionLogger.debug('Active sessions status', {
            totalSessions: stats.totalSessions,
            oldestSession: stats.oldestSession,
          });
        }
      },
      5 * 60 * 1000
    ); // Check every 5 minutes

    // Start HTTP server
    const { createServer } = await import('http');
    this.httpServer = createServer((req, res) => this.handleRequest(req, res));

    return new Promise((resolve, reject) => {
      this.httpServer!.listen(this.port, () => {
        serverLogger.info('GitLab MCP Streamable HTTP server started', {
          port: this.port,
          healthEndpoint: `http://localhost:${this.port}/health`,
          heartbeatEndpoint: `http://localhost:${this.port}/heartbeat`,
          mcpEndpoint: `http://localhost:${this.port}/mcp`,
        });
        resolve();
      });

      this.httpServer!.on('error', (error: any) => {
        if (this.httpServer!.listening) {
          // Runtime error - log but don't crash
          serverLogger.error('HTTP server runtime error - server may be unstable', { error });
        } else {
          // Startup error - reject promise
          serverLogger.error('HTTP server startup error', { error });
          reject(error);
        }
      });
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
      return new Promise(resolve => {
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
    serverLogger.info('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    serverLogger.info('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  server.start().catch(error => {
    serverLogger.error('Failed to start server', { error });
    process.exit(1);
  });
}
