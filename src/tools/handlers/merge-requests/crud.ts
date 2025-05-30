/**
 * Basic merge request CRUD operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

/**
 * List merge requests handler
 */
export const listMergeRequests: ToolHandler = async (params, context) => {
  const { project_id, state, scope } = params.arguments || {};
  if (!project_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests`,
    { params: { state, scope } }
  );
  return formatResponse(response.data);
};

/**
 * Get merge request details handler
 */
export const getMergeRequest: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid } = params.arguments || {};
  if (!project_id || !merge_request_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}`
  );
  return formatResponse(response.data);
};

/**
 * Get merge request changes handler
 */
export const getMergeRequestChanges: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid } = params.arguments || {};
  if (!project_id || !merge_request_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/changes`
  );
  return formatResponse(response.data);
};

/**
 * Create merge request handler
 */
export const createMergeRequest: ToolHandler = async (params, context) => {
  const { 
    project_id, 
    source_branch, 
    target_branch, 
    title, 
    description, 
    assignee_id, 
    assignee_ids, 
    reviewer_ids, 
    target_project_id, 
    labels, 
    milestone_id, 
    remove_source_branch, 
    allow_collaboration, 
    squash 
  } = params.arguments || {};
  
  if (!project_id || !source_branch || !target_branch || !title) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, source_branch, target_branch, and title are required');
  }
  
  const requestBody: any = {
    source_branch,
    target_branch,
    title,
    remove_source_branch: remove_source_branch !== undefined ? remove_source_branch : true,
    squash: squash !== undefined ? squash : true
  };
  
  if (description) requestBody.description = description;
  if (assignee_id) requestBody.assignee_id = assignee_id;
  if (assignee_ids) requestBody.assignee_ids = assignee_ids;
  if (reviewer_ids) requestBody.reviewer_ids = reviewer_ids;
  if (target_project_id) requestBody.target_project_id = target_project_id;
  if (labels) requestBody.labels = labels;
  if (milestone_id) requestBody.milestone_id = milestone_id;
  if (allow_collaboration !== undefined) requestBody.allow_collaboration = allow_collaboration;
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests`,
    requestBody
  );
  return formatResponse(response.data);
};

/**
 * Update merge request title and description handler
 */
export const updateMergeRequest: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, title, description } = params.arguments || {};
  if (!project_id || !merge_request_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
  }
  
  if (!title && !description) {
    throw new McpError(ErrorCode.InvalidParams, 'At least one of title or description is required');
  }
  
  const response = await context.axiosInstance.put(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}`,
    { title, description }
  );
  return formatResponse(response.data);
};

/**
 * Mark merge request ready handler
 */
export const markMergeRequestReady: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid } = params.arguments || {};
  if (!project_id || !merge_request_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
  }
  
  const response = await context.axiosInstance.put(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}`,
    { draft: false }
  );
  return formatResponse(response.data);
};

/**
 * Merge merge request handler
 */
export const mergeMergeRequest: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, merge_commit_message, squash, should_remove_source_branch } = params.arguments || {};
  if (!project_id || !merge_request_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
  }
  
  const requestBody: any = {};
  if (merge_commit_message) requestBody.merge_commit_message = merge_commit_message;
  if (squash !== undefined) requestBody.squash = squash;
  if (should_remove_source_branch !== undefined) requestBody.should_remove_source_branch = should_remove_source_branch;
  
  const response = await context.axiosInstance.put(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/merge`,
    requestBody
  );
  return formatResponse(response.data);
};