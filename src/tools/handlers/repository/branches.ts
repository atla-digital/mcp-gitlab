/**
 * Branch-related handler functions
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

/**
 * List branches handler
 */
export const listBranches: ToolHandler = async (params, context) => {
  const { project_id, search } = params.arguments || {};
  if (!project_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/repository/branches`,
    { params: { search } }
  );
  return formatResponse(response.data);
};

/**
 * Create branch handler
 */
export const createBranch: ToolHandler = async (params, context) => {
  const { project_id, branch, ref } = params.arguments || {};
  if (!project_id || !branch || !ref) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, branch, and ref are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/repository/branches`,
    { branch, ref }
  );
  return formatResponse(response.data);
};

/**
 * Delete branch handler
 */
export const deleteBranch: ToolHandler = async (params, context) => {
  const { project_id, branch } = params.arguments || {};
  if (!project_id || !branch) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and branch are required');
  }
  
  await context.axiosInstance.delete(
    `/projects/${encodeURIComponent(String(project_id))}/repository/branches/${encodeURIComponent(String(branch))}`
  );
  return formatResponse({ success: true, message: `Branch '${branch}' deleted successfully` });
};

/**
 * Compare branches handler
 */
export const compareBranches: ToolHandler = async (params, context) => {
  const { project_id, from, to } = params.arguments || {};
  if (!project_id || !from || !to) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, from, and to are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/repository/compare`,
    { params: { from, to } }
  );
  return formatResponse(response.data);
};