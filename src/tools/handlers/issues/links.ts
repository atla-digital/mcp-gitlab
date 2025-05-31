/**
 * Issue links operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

/**
 * List linked issues handler
 */
export const listIssueLinks: ToolHandler = async (params, context) => {
  const { project_id, issue_iid } = params.arguments || {};
  if (!project_id || !issue_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and issue_iid are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/links`
  );
  return formatResponse(response.data);
};

/**
 * Create issue link handler
 */
export const createIssueLink: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, target_project_id, target_issue_iid, link_type = 'relates_to' } = params.arguments || {};
  if (!project_id || !issue_iid || !target_project_id || !target_issue_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, issue_iid, target_project_id, and target_issue_iid are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/links`,
    {
      target_project_id: String(target_project_id),
      target_issue_iid: Number(target_issue_iid),
      link_type
    }
  );
  return formatResponse(response.data);
};

/**
 * Delete issue link handler
 */
export const deleteIssueLink: ToolHandler = async (params, context) => {
  const { project_id, issue_iid, issue_link_id } = params.arguments || {};
  if (!project_id || !issue_iid || !issue_link_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, issue_iid, and issue_link_id are required');
  }
  
  const response = await context.axiosInstance.delete(
    `/projects/${encodeURIComponent(String(project_id))}/issues/${issue_iid}/links/${issue_link_id}`
  );
  return formatResponse(response.data);
};