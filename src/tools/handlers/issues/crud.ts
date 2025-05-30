/**
 * Issue CRUD operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

/**
 * List issues handler
 */
export const listIssues: ToolHandler = async (params, context) => {
  const { project_id, state, labels } = params.arguments || {};
  if (!project_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/issues`,
    { params: { state, labels } }
  );
  return formatResponse(response.data);
};

/**
 * Create issue handler
 */
export const createIssue: ToolHandler = async (params, context) => {
  const { project_id, title, description, labels, assignee_ids, confidential } = params.arguments || {};
  if (!project_id || !title) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and title are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/issues`,
    { 
      title,
      description,
      labels,
      assignee_ids,
      confidential: confidential === true
    }
  );
  return formatResponse(response.data);
};

/**
 * Get issue details handler
 */
export const getIssue: ToolHandler = async (params, context) => {
  const { project_id, issue_iid } = params.arguments || {};
  if (!project_id || !issue_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and issue_iid are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}`
  );
  return formatResponse(response.data);
};

/**
 * Update issue handler
 */
export const updateIssue: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, title, description, assignee_ids, labels, state_event } = params.arguments || {};
  if (!project_id || !issue_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and issue_iid are required');
  }
  
  const requestBody: any = {};
  if (title) requestBody.title = title;
  if (description) requestBody.description = description;
  if (assignee_ids) requestBody.assignee_ids = assignee_ids;
  if (labels) requestBody.labels = labels;
  if (state_event) requestBody.state_event = state_event;
  
  const response = await context.axiosInstance.put(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}`,
    requestBody
  );
  return formatResponse(response.data);
};