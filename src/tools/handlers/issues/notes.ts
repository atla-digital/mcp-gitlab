/**
 * Issue notes/comments operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

/**
 * List issue notes handler
 */
export const listIssueNotes: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, sort, order_by } = params.arguments || {};
  if (!project_id || !issue_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and issue_iid are required');
  }

  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/notes`,
    { params: { sort, order_by } }
  );
  return formatResponse(response.data);
};

/**
 * Create issue note handler
 */
export const createIssueNote: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, body } = params.arguments || {};
  if (!project_id || !issue_iid || !body) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, issue_iid, and body are required');
  }

  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/notes`,
    { body }
  );
  return formatResponse(response.data);
};

/**
 * Get issue note handler
 */
export const getIssueNote: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, note_id } = params.arguments || {};
  if (!project_id || !issue_iid || !note_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, issue_iid, and note_id are required');
  }

  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/notes/${note_id}`
  );
  return formatResponse(response.data);
};

/**
 * Update issue note handler
 */
export const updateIssueNote: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, note_id, body } = params.arguments || {};
  if (!project_id || !issue_iid || !note_id || !body) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, issue_iid, note_id, and body are required');
  }

  const response = await context.axiosInstance.put(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/notes/${note_id}`,
    { body }
  );
  return formatResponse(response.data);
};

/**
 * Delete issue note handler
 */
export const deleteIssueNote: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, note_id } = params.arguments || {};
  if (!project_id || !issue_iid || !note_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, issue_iid, and note_id are required');
  }

  await context.axiosInstance.delete(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/notes/${note_id}`
  );
  return formatResponse({ success: true, message: 'Note deleted successfully' });
};
