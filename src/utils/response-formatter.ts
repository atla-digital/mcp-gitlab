/**
 * Utility functions for formatting MCP responses
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

/**
 * Format an API response for MCP protocol with structured content support
 * 
 * @param data The data to format
 * @param options Optional formatting options
 * @returns Formatted MCP response with both text and structured content
 */
export function formatResponse(data: any, options?: { 
  includeStructuredContent?: boolean;
  textOnly?: boolean;
}) {
  const textContent = JSON.stringify(data, null, 2);
  
  // If textOnly is specified, return only text content for backwards compatibility
  if (options?.textOnly) {
    return {
      content: [{
        type: 'text' as const,
        text: textContent
      }]
    };
  }
  
  // Default behavior: include both text and structured content
  const response: any = {
    content: [{
      type: 'text' as const,
      text: textContent
    }]
  };
  
  // Add structured content if enabled (default true) and data is an object
  if ((options?.includeStructuredContent !== false) && 
      data && 
      typeof data === 'object' && 
      !Array.isArray(data)) {
    response.structuredContent = data;
  }
  
  return response;
}

/**
 * Format a GitLab project list response with proper structure
 */
export function formatProjectsResponse(projects: any[]) {
  return formatResponse({ projects });
}

/**
 * Format a single GitLab project response with proper structure
 */
export function formatProjectResponse(project: any) {
  return formatResponse({ project });
}

/**
 * Format a GitLab branches list response with proper structure
 */
export function formatBranchesResponse(branches: any[]) {
  return formatResponse({ branches });
}

/**
 * Format a GitLab issues list response with proper structure
 */
export function formatIssuesResponse(issues: any[]) {
  return formatResponse({ issues });
}

/**
 * Format a single GitLab issue response with proper structure
 */
export function formatIssueResponse(issue: any) {
  return formatResponse({ issue });
}

/**
 * Format a GitLab merge requests list response with proper structure
 */
export function formatMergeRequestsResponse(mergeRequests: any[]) {
  return formatResponse({ merge_requests: mergeRequests });
}

/**
 * Format a single GitLab merge request response with proper structure
 */
export function formatMergeRequestResponse(mergeRequest: any) {
  return formatResponse({ merge_request: mergeRequest });
}

/**
 * Handle errors from API calls
 * 
 * @param error The error object
 * @param defaultMessage Default message to use
 * @returns McpError object
 */
export function handleApiError(error: unknown, defaultMessage: string): McpError {
  if (axios.isAxiosError(error)) {
    return new McpError(
      ErrorCode.InternalError,
      `GitLab API error: ${error.response?.data?.message || error.message}`
    );
  }
  if (error instanceof Error) {
    return new McpError(
      ErrorCode.InternalError,
      `${defaultMessage}: ${error.message}`
    );
  }
  return new McpError(
    ErrorCode.InternalError,
    defaultMessage
  );
} 