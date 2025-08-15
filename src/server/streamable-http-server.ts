#!/usr/bin/env node
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
import { config } from '../utils/config.js';

interface SessionData {
  gitlabApiToken: string;
  gitlabApiUrl: string;
  handlerContext: HandlerContext;
  lastUsed: Date;
  sessionId?: string;
  initialized: boolean;
  initializationCount: number;
  clientInfo?: any;
}

class GitLabStreamableHttpServer {
  private httpServer?: any;
  private sessions = new Map<string, SessionData>();
  private cleanupInterval?: NodeJS.Timeout;
  private port: number;
  private currentSessionData: SessionData | null = null;

  constructor(port: number = config.port) {
    this.port = port;
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
        timeout: config.axiosTimeout,
      });

      // Add request/response logging
      axiosInstance.interceptors.request.use(
        axiosConfig => {
          const maskedToken = gitlabApiToken.substring(0, 8) + '...';
          if (config.enableRequestLogging) {
            apiLogger.http('GitLab API Request', {
              method: axiosConfig.method?.toUpperCase(),
              url: `${axiosConfig.baseURL}${axiosConfig.url}`,
              token: maskedToken,
              hasBody: !!axiosConfig.data,
              bodyPreview: axiosConfig.data
                ? JSON.stringify(axiosConfig.data).substring(0, 100)
                : undefined,
            });
          }
          return axiosConfig;
        },
        error => {
          apiLogger.error('GitLab API Request Error', { error: error.message });
          return Promise.reject(error);
        }
      );

      axiosInstance.interceptors.response.use(
        response => {
          if (config.enableRequestLogging) {
            apiLogger.http('GitLab API Response', {
              status: response.status,
              statusText: response.statusText,
              url: response.config.url,
            });
          }
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
        sessionId: undefined, // Will be set during initialization
        initialized: false,
        initializationCount: 0,
        clientInfo: undefined,
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

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    // LOG ALL INCOMING REQUESTS WITH FULL DETAILS
    const timestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substring(2, 8);
    
    try {
      
      // Log request basics
      serverLogger.info(`[${requestId}] HTTP Request`, {
        method: req.method,
        url: req.url,
        timestamp,
        userAgent: req.headers['user-agent'] || 'none',
        contentType: req.headers['content-type'] || 'none',
        accept: req.headers.accept || 'none',
        contentLength: req.headers['content-length'] || 'none',
        host: req.headers.host || 'none',
        origin: req.headers.origin || 'none'
      });

      // Log ALL headers (masking sensitive data)
      const headers = { ...req.headers };
      if (headers['x-gitlab-token']) {
        const token = headers['x-gitlab-token'] as string;
        headers['x-gitlab-token'] = token.substring(0, 8) + '...' + token.substring(token.length - 4);
      }
      serverLogger.info(`[${requestId}] All Headers`, headers);

      // Log specific MCP-related headers
      serverLogger.info(`[${requestId}] MCP Headers`, {
        mcpSessionId: req.headers['mcp-session-id'] || 'none',
        gitlabToken: req.headers['x-gitlab-token'] ? 
          (req.headers['x-gitlab-token'] as string).substring(0, 8) + '...' : 'MISSING',
        gitlabUrl: req.headers['x-gitlab-url'] || 'MISSING',
        authorization: req.headers.authorization ? 'present' : 'none'
      });

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

      // Session management endpoints
      if (req.url === '/sessions' && req.method === 'GET') {
        const stats = this.getDetailedSessionStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
      }

      if (req.url === '/sessions/cleanup' && req.method === 'POST') {
        try {
          const body = await this.readRequestBody(req);
          const { sessionKey } = JSON.parse(body || '{}');
          
          if (!sessionKey) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'sessionKey required' }));
            return;
          }

          const success = this.cleanupSession(sessionKey);
          res.writeHead(success ? 200 : 404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success, 
            message: success ? 'Session cleaned up' : 'Session not found' 
          }));
          return;
        } catch (error: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
          return;
        }
      }

      if (req.url === '/sessions/reset' && req.method === 'POST') {
        try {
          const body = await this.readRequestBody(req);
          const { sessionKey } = JSON.parse(body || '{}');
          
          if (!sessionKey) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'sessionKey required' }));
            return;
          }

          const success = this.resetSessionInitialization(sessionKey);
          res.writeHead(success ? 200 : 404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success, 
            message: success ? 'Session initialization reset' : 'Session not found' 
          }));
          return;
        } catch (error: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
          return;
        }
      }

      // MCP endpoint
      if (req.url === '/mcp') {
        // Read and parse the request body first
        const body = await this.readRequestBody(req);
        const parsedBody = body ? JSON.parse(body) : undefined;

        // Log request body details for debugging
        serverLogger.info(`[${requestId}] MCP Request Body`, {
          hasBody: !!body,
          bodyLength: body?.length || 0,
          bodyPreview: body ? body.substring(0, 200) + (body.length > 200 ? '...' : '') : 'none',
          method: parsedBody?.method || 'none',
          id: parsedBody?.id || 'none',
          hasParams: !!parsedBody?.params,
          jsonrpcVersion: parsedBody?.jsonrpc || 'none'
        });

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

        // Handle ALL MCP requests with custom logic - no SDK transport needed
        const customHandledMethods = ['initialize', 'notifications/initialized', 'tools/list', 'prompts/list', 'resources/list', 'tools/call', 'prompts/get', 'resources/read'];
        const methodsNotRequiringSession = ['tools/list', 'prompts/list', 'resources/list', 'prompts/get'];
        if (customHandledMethods.includes(parsedBody?.method) && (sessionData || methodsNotRequiringSession.includes(parsedBody?.method))) {
          try {
            const sessionKey = sessionData ? `${sessionData.gitlabApiToken}:${sessionData.gitlabApiUrl}` : null;
            
            if (parsedBody.method === 'initialize') {
              // Handle initialization request - sessionKey must exist for initialization
              if (!sessionKey) {
                throw new Error('Session data required for initialization');
              }
              const initResult = await this.handleReinitialization(sessionKey, parsedBody.params || {});
              
              // Check if client expects SSE or JSON based on Accept header
              const acceptHeader = req.headers.accept || '';
              const expectsSSE = acceptHeader.includes('text/event-stream');
              
              // Send response in appropriate format
              const responseData = {
                jsonrpc: '2.0',
                id: parsedBody.id,
                result: initResult
              };

              if (expectsSSE) {
                // Send as Server-Sent Events
                const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                serverLogger.info(`[${requestId}] Sending SSE initialization response`, {
                  statusCode: 200,
                  contentType: 'text/event-stream',
                  sessionId: initResult.sessionId,
                  responsePreview: sseResponse.substring(0, 200) + '...'
                });
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'Mcp-Session-Id': initResult.sessionId
                });
                res.end(sseResponse);
              } else {
                // Send as pure JSON
                const jsonResponse = JSON.stringify(responseData);
                serverLogger.info(`[${requestId}] Sending JSON initialization response`, {
                  statusCode: 200,
                  contentType: 'application/json',
                  sessionId: initResult.sessionId,
                  responseBody: jsonResponse
                });
                res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Mcp-Session-Id': initResult.sessionId
                });
                res.end(jsonResponse);
              }
            } else if (parsedBody.method === 'notifications/initialized') {
              // Handle notifications/initialized request - just acknowledge
              serverLogger.info(`[${requestId}] Handling notifications/initialized with custom logic`, {
                sessionId: sessionData?.sessionId || 'none'
              });
              
              // MCP notifications don't expect a response, so just send 204 No Content
              serverLogger.info(`[${requestId}] Sending 204 No Content for notifications/initialized`, {
                statusCode: 204
              });
              res.writeHead(204);
              res.end();
            } else if (parsedBody.method === 'tools/list') {
              // Handle tools/list request
              serverLogger.info(`[${requestId}] Handling tools/list with custom logic`);
              
              const responseData = {
                jsonrpc: '2.0',
                id: parsedBody.id,
                result: { tools: toolDefinitions }
              };

              // Check if client expects SSE or JSON based on Accept header
              const acceptHeader = req.headers.accept || '';
              const expectsSSE = acceptHeader.includes('text/event-stream');
              
              if (expectsSSE) {
                const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                serverLogger.info(`[${requestId}] Sending SSE tools/list response`, {
                  statusCode: 200,
                  contentType: 'text/event-stream',
                  toolCount: toolDefinitions.length
                });
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive'
                });
                res.end(sseResponse);
              } else {
                const jsonResponse = JSON.stringify(responseData);
                serverLogger.info(`[${requestId}] Sending JSON tools/list response`, {
                  statusCode: 200,
                  contentType: 'application/json',
                  toolCount: toolDefinitions.length
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jsonResponse);
              }
            } else if (parsedBody.method === 'prompts/list') {
              // Handle prompts/list request
              serverLogger.info(`[${requestId}] Handling prompts/list with custom logic`);
              
              const responseData = {
                jsonrpc: '2.0',
                id: parsedBody.id,
                result: { prompts: promptDefinitions }
              };

              // Check if client expects SSE or JSON based on Accept header
              const acceptHeader = req.headers.accept || '';
              const expectsSSE = acceptHeader.includes('text/event-stream');
              
              if (expectsSSE) {
                const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                serverLogger.info(`[${requestId}] Sending SSE prompts/list response`, {
                  statusCode: 200,
                  contentType: 'text/event-stream',
                  promptCount: promptDefinitions.length
                });
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive'
                });
                res.end(sseResponse);
              } else {
                const jsonResponse = JSON.stringify(responseData);
                serverLogger.info(`[${requestId}] Sending JSON prompts/list response`, {
                  statusCode: 200,
                  contentType: 'application/json',
                  promptCount: promptDefinitions.length
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jsonResponse);
              }
            } else if (parsedBody.method === 'resources/list') {
              // Handle resources/list request
              serverLogger.info(`[${requestId}] Handling resources/list with custom logic`);
              
              // Resources list doesn't require GitLab session (returns empty list by default)
              const resourcesResult = await handleListResources();
              const responseData = {
                jsonrpc: '2.0',
                id: parsedBody.id,
                result: resourcesResult
              };

              // Check if client expects SSE or JSON based on Accept header
              const acceptHeader = req.headers.accept || '';
              const expectsSSE = acceptHeader.includes('text/event-stream');
              
              if (expectsSSE) {
                const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                serverLogger.info(`[${requestId}] Sending SSE resources/list response`, {
                  statusCode: 200,
                  contentType: 'text/event-stream',
                  resourceCount: resourcesResult.resources?.length || 0
                });
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive'
                });
                res.end(sseResponse);
              } else {
                const jsonResponse = JSON.stringify(responseData);
                serverLogger.info(`[${requestId}] Sending JSON resources/list response`, {
                  statusCode: 200,
                  contentType: 'application/json',
                  resourceCount: resourcesResult.resources?.length || 0
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jsonResponse);
              }
            } else if (parsedBody.method === 'tools/call') {
              // Handle tools/call request with custom logic - this fixes "Server not initialized" errors
              serverLogger.info(`[${requestId}] Handling tools/call with custom logic`, {
                toolName: parsedBody.params?.name,
                hasArguments: !!parsedBody.params?.arguments,
                sessionId: sessionData?.sessionId || 'none'
              });
              
              if (!sessionData) {
                throw new Error('Session data required for tool calls');
              }

              const toolName = parsedBody.params?.name;
              const toolArgs = parsedBody.params?.arguments || {};

              if (!toolName || typeof toolName !== 'string') {
                throw new Error('Tool name is required');
              }

              // Get tool handler from registry
              const handler = toolRegistry[toolName];
              if (!handler) {
                throw new Error(`Unknown tool: ${toolName}`);
              }

              try {
                // Call the tool handler with our session context
                const result = await handler({ name: toolName, arguments: toolArgs }, sessionData.handlerContext);
                
                const responseData = {
                  jsonrpc: '2.0',
                  id: parsedBody.id,
                  result: result
                };

                // Check if client expects SSE or JSON based on Accept header
                const acceptHeader = req.headers.accept || '';
                const expectsSSE = acceptHeader.includes('text/event-stream');
                
                if (expectsSSE) {
                  const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                  serverLogger.info(`[${requestId}] Sending SSE tools/call response`, {
                    statusCode: 200,
                    contentType: 'text/event-stream',
                    toolName: toolName,
                    success: true
                  });
                  res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                  });
                  res.end(sseResponse);
                } else {
                  const jsonResponse = JSON.stringify(responseData);
                  serverLogger.info(`[${requestId}] Sending JSON tools/call response`, {
                    statusCode: 200,
                    contentType: 'application/json',
                    toolName: toolName,
                    success: true
                  });
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(jsonResponse);
                }
              } catch (toolError: any) {
                // Handle tool execution errors
                const errorResponse = {
                  jsonrpc: '2.0',
                  id: parsedBody.id,
                  error: {
                    code: -32603,
                    message: toolError.message || 'Tool execution failed',
                    data: { toolName: toolName }
                  }
                };

                const acceptHeader = req.headers.accept || '';
                const expectsSSE = acceptHeader.includes('text/event-stream');
                
                if (expectsSSE) {
                  const sseResponse = `event: message\ndata: ${JSON.stringify(errorResponse)}\n\n`;
                  serverLogger.error(`[${requestId}] Sending SSE tools/call error response`, {
                    statusCode: 400,
                    contentType: 'text/event-stream',
                    toolName: toolName,
                    error: toolError.message
                  });
                  res.writeHead(400, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                  });
                  res.end(sseResponse);
                } else {
                  const jsonResponse = JSON.stringify(errorResponse);
                  serverLogger.error(`[${requestId}] Sending JSON tools/call error response`, {
                    statusCode: 400,
                    contentType: 'application/json',
                    toolName: toolName,
                    error: toolError.message
                  });
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(jsonResponse);
                }
              }
            } else if (parsedBody.method === 'prompts/get') {
              // Handle prompts/get request with custom logic
              serverLogger.info(`[${requestId}] Handling prompts/get with custom logic`, {
                promptName: parsedBody.params?.name
              });
              
              const promptName = parsedBody.params?.name;
              if (!promptName || typeof promptName !== 'string') {
                throw new Error('Prompt name is required');
              }

              // Get prompt template
              const template = promptTemplates[promptName];
              if (!template) {
                throw new Error(`Unknown prompt: ${promptName}`);
              }

              let content = template;

              // Replace argument placeholders if arguments are provided
              if (parsedBody.params?.arguments) {
                for (const [key, value] of Object.entries(parsedBody.params.arguments)) {
                  const placeholder = `{{${key}}}`;
                  content = content.replace(new RegExp(placeholder, 'g'), String(value));
                }
              }

              // Remove any remaining unused placeholders
              content = content.replace(/\{\{additional_instructions\}\}\s*/g, '');

              const responseData = {
                jsonrpc: '2.0',
                id: parsedBody.id,
                result: {
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
                }
              };

              // Send response in appropriate format
              const acceptHeader = req.headers.accept || '';
              const expectsSSE = acceptHeader.includes('text/event-stream');
              
              if (expectsSSE) {
                const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                serverLogger.info(`[${requestId}] Sending SSE prompts/get response`, {
                  statusCode: 200,
                  contentType: 'text/event-stream',
                  promptName: promptName
                });
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive'
                });
                res.end(sseResponse);
              } else {
                const jsonResponse = JSON.stringify(responseData);
                serverLogger.info(`[${requestId}] Sending JSON prompts/get response`, {
                  statusCode: 200,
                  contentType: 'application/json',
                  promptName: promptName
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jsonResponse);
              }
            } else if (parsedBody.method === 'resources/read') {
              // Handle resources/read request with custom logic
              serverLogger.info(`[${requestId}] Handling resources/read with custom logic`, {
                uri: parsedBody.params?.uri
              });
              
              if (!sessionData) {
                throw new Error('Session data required for resource reading');
              }

              const uri = parsedBody.params?.uri;
              if (!uri || typeof uri !== 'string') {
                throw new Error('Resource URI is required');
              }

              try {
                // Use our resource handler
                const resourceResult = await handleReadResource(
                  uri,
                  sessionData.handlerContext.axiosInstance
                );
                
                const responseData = {
                  jsonrpc: '2.0',
                  id: parsedBody.id,
                  result: resourceResult
                };

                // Send response in appropriate format
                const acceptHeader = req.headers.accept || '';
                const expectsSSE = acceptHeader.includes('text/event-stream');
                
                if (expectsSSE) {
                  const sseResponse = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
                  serverLogger.info(`[${requestId}] Sending SSE resources/read response`, {
                    statusCode: 200,
                    contentType: 'text/event-stream',
                    uri: uri
                  });
                  res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                  });
                  res.end(sseResponse);
                } else {
                  const jsonResponse = JSON.stringify(responseData);
                  serverLogger.info(`[${requestId}] Sending JSON resources/read response`, {
                    statusCode: 200,
                    contentType: 'application/json',
                    uri: uri
                  });
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(jsonResponse);
                }
              } catch (resourceError: any) {
                // Handle resource read errors
                const errorResponse = {
                  jsonrpc: '2.0',
                  id: parsedBody.id,
                  error: {
                    code: -32603,
                    message: resourceError.message || 'Resource read failed',
                    data: { uri: uri }
                  }
                };

                const acceptHeader = req.headers.accept || '';
                const expectsSSE = acceptHeader.includes('text/event-stream');
                
                if (expectsSSE) {
                  const sseResponse = `event: message\ndata: ${JSON.stringify(errorResponse)}\n\n`;
                  serverLogger.error(`[${requestId}] Sending SSE resources/read error response`, {
                    statusCode: 400,
                    contentType: 'text/event-stream',
                    uri: uri,
                    error: resourceError.message
                  });
                  res.writeHead(400, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                  });
                  res.end(sseResponse);
                } else {
                  const jsonResponse = JSON.stringify(errorResponse);
                  serverLogger.error(`[${requestId}] Sending JSON resources/read error response`, {
                    statusCode: 400,
                    contentType: 'application/json',
                    uri: uri,
                    error: resourceError.message
                  });
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(jsonResponse);
                }
              }
            }
            
            // Clear current session data and return early
            this.currentSessionData = null;
            return;
          } catch (error: any) {
            sessionLogger.error('Custom request handler failed', { 
              error: error.message,
              method: parsedBody?.method
            });
            
            // Send error response for failed custom handlers
            const errorResponse = {
              jsonrpc: '2.0',
              id: parsedBody?.id || null,
              error: {
                code: -32603,
                message: error.message || 'Internal error'
              }
            };

            const acceptHeader = req.headers.accept || '';
            const expectsSSE = acceptHeader.includes('text/event-stream');
            
            if (expectsSSE) {
              const sseResponse = `event: message\ndata: ${JSON.stringify(errorResponse)}\n\n`;
              res.writeHead(500, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              });
              res.end(sseResponse);
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(errorResponse));
            }
            return;
          }
        }

        // If method is not handled, return method not found error
        const errorResponse = {
          jsonrpc: '2.0',
          id: parsedBody?.id || null,
          error: {
            code: -32601,
            message: `Method not found: ${parsedBody?.method || 'unknown'}`
          }
        };

        serverLogger.warn(`[${requestId}] Unknown method requested`, {
          method: parsedBody?.method,
          availableMethods: customHandledMethods
        });

        const acceptHeader = req.headers.accept || '';
        const expectsSSE = acceptHeader.includes('text/event-stream');
        
        if (expectsSSE) {
          const sseResponse = `event: message\ndata: ${JSON.stringify(errorResponse)}\n\n`;
          res.writeHead(404, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          res.end(sseResponse);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(errorResponse));
        }

        // Clear current session data
        this.currentSessionData = null;
        return;
      }

      // 404 for other paths
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error: any) {
      serverLogger.error(`[${requestId}] Request handling error`, { 
        error: error.message, 
        stack: error.stack?.substring(0, 500),
        url: req.url, 
        method: req.method 
      });
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        const errorResponse = JSON.stringify({ error: 'Internal server error' });
        serverLogger.error(`[${requestId}] Sending 500 response`, { 
          statusCode: 500, 
          responseBody: errorResponse 
        });
        res.end(errorResponse);
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
    const maxAge = config.sessionMaxAge;
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

  /**
   * Clean up a specific session by session key
   */
  cleanupSession(sessionKey: string): boolean {
    const session = this.sessions.get(sessionKey);
    if (session) {
      this.sessions.delete(sessionKey);
      sessionLogger.info('Session cleaned up', {
        sessionKey: sessionKey.split(':')[0].substring(0, 8) + '...',
        sessionId: session.sessionId,
      });
      return true;
    }
    return false;
  }

  /**
   * Reset initialization state for a specific session
   */
  resetSessionInitialization(sessionKey: string): boolean {
    const session = this.sessions.get(sessionKey);
    if (session) {
      session.initialized = false;
      session.initializationCount = 0;
      session.sessionId = undefined;
      session.clientInfo = undefined;
      session.lastUsed = new Date();
      sessionLogger.info('Session initialization reset', {
        sessionKey: sessionKey.split(':')[0].substring(0, 8) + '...',
      });
      return true;
    }
    return false;
  }

  /**
   * Get detailed session information
   */
  getDetailedSessionStats(): any {
    const sessions = Array.from(this.sessions.entries()).map(([key, session]) => ({
      key: key.split(':')[0].substring(0, 8) + '...',
      sessionId: session.sessionId,
      initialized: session.initialized,
      initializationCount: session.initializationCount,
      lastUsed: session.lastUsed.toISOString(),
      clientInfo: session.clientInfo?.name || 'unknown',
    }));

    return {
      totalSessions: this.sessions.size,
      sessions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle reinitialization gracefully by resetting session state
   */
  async handleReinitialization(sessionKey: string, initParams: any): Promise<any> {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      throw new Error('Session not found');
    }

    // If this is a reinitialization attempt, reset the session state
    if (session.initialized) {
      sessionLogger.warn('Reinitialization detected - resetting session state', {
        sessionKey: sessionKey.split(':')[0].substring(0, 8) + '...',
        previousInitCount: session.initializationCount,
        previousSessionId: session.sessionId,
      });
      
      // Reset initialization state but keep the session
      session.initialized = false;
      session.sessionId = undefined;
    }

    // Generate new session ID and update state
    const newSessionId = randomUUID();
    session.sessionId = newSessionId;
    session.initialized = true;
    session.initializationCount += 1;
    session.clientInfo = initParams.clientInfo;
    session.lastUsed = new Date();

    sessionLogger.info('Session (re)initialized successfully', {
      sessionKey: sessionKey.split(':')[0].substring(0, 8) + '...',
      sessionId: newSessionId,
      initCount: session.initializationCount,
      clientName: initParams.clientInfo?.name || 'unknown',
    });

    return {
      protocolVersion: initParams.protocolVersion || '1.0.0',
      capabilities: {
        tools: { listChanged: false },
        prompts: { listChanged: false },
        resources: { listChanged: false, subscribe: false },
        experimental: {},
      },
      serverInfo: {
        name: 'mcp-gitlab',
        version: '1.0.0',
      },
      sessionId: newSessionId,
    };
  }

  async start(): Promise<void> {
    // Set up cleanup and monitoring intervals
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
      const stats = this.getSessionStats();
      if (stats.totalSessions > 0) {
        sessionLogger.debug('Active sessions status', {
          totalSessions: stats.totalSessions,
          oldestSession: stats.oldestSession,
        });
      }
    }, config.sessionCleanupInterval);

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

    if (this.httpServer) {
      return new Promise(resolve => {
        this.httpServer!.close(resolve);
      });
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GitLabStreamableHttpServer();

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
