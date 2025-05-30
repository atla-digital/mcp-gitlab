/**
 * Merge request comments and notes handlers
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

/**
 * Create merge request note handler
 */
export const createMergeRequestNote: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, body } = params.arguments || {};
  if (!project_id || !merge_request_iid || !body) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, and body are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/notes`,
    { body }
  );
  return formatResponse(response.data);
};

/**
 * Create merge request note handler with internal note option
 */
export const createMergeRequestNoteInternal: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, body, internal } = params.arguments || {};
  if (!project_id || !merge_request_iid || !body) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, and body are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/notes`,
    { body, internal: internal === true }
  );
  return formatResponse(response.data);
};