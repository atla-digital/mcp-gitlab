/**
 * Repository-related tool handlers
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../utils/handler-types.js";
import { formatResponse } from "../utils/response-formatter.js";

/**
 * List projects handler
 */
export const listProjects: ToolHandler = async (params, context) => {
  const { search, owned, membership, per_page } = params.arguments || {};
  const response = await context.axiosInstance.get('/projects', {
    params: {
      search,
      owned: owned === true ? true : undefined,
      membership: membership === true ? true : undefined,
      per_page: per_page || 20
    }
  });
  
  return formatResponse(response.data);
};

/**
 * Get project details handler
 */
export const getProject: ToolHandler = async (params, context) => {
  const { project_id } = params.arguments || {};
  if (!project_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id is required');
  }
  
  const response = await context.axiosInstance.get(`/projects/${encodeURIComponent(String(project_id))}`);
  return formatResponse(response.data);
};

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
 * Get repository file handler
 */
export const getRepositoryFile: ToolHandler = async (params, context) => {
  const { project_id, file_path, ref } = params.arguments || {};
  if (!project_id || !file_path) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and file_path are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/repository/files/${encodeURIComponent(String(file_path))}`,
    { params: { ref: ref || 'main' } }
  );
  return formatResponse(response.data);
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

/**
 * List merge request discussions handler
 */
export const listMergeRequestDiscussions: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid } = params.arguments || {};
  if (!project_id || !merge_request_iid) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id and merge_request_iid are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/discussions`
  );
  return formatResponse(response.data);
};

/**
 * Get specific merge request discussion handler
 */
export const getMergeRequestDiscussion: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, discussion_id } = params.arguments || {};
  if (!project_id || !merge_request_iid || !discussion_id) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, and discussion_id are required');
  }
  
  const response = await context.axiosInstance.get(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/discussions/${discussion_id}`
  );
  return formatResponse(response.data);
};

/**
 * Create merge request discussion handler
 */
export const createMergeRequestDiscussion: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, body, position } = params.arguments || {};
  
  // Type the position parameter properly
  interface Position {
    base_sha: string;
    head_sha: string;
    start_sha: string;
    old_path: string;
    new_path: string;
    position_type: string;
    old_line?: number;
    new_line?: number;
    start_line?: number;
    end_line?: number;
  }
  const typedPosition = position as Position;
  if (!project_id || !merge_request_iid || !body) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, and body are required');
  }
  
  const requestData: any = { body };
  
  // Add position data if provided for line-specific comments
  if (typedPosition) {
    // Get the merge request details to find file blob SHAs
    try {
      const mrResponse = await context.axiosInstance.get(
        `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/changes`
      );
      
      // Find the file in the changes to get the correct blob SHA
      const filePath = typedPosition.new_path || typedPosition.old_path;
      const fileChange = mrResponse.data.changes.find((change: any) => 
        change.new_path === filePath || change.old_path === filePath
      );
      
      if (!fileChange) {
        throw new Error(`File ${filePath} not found in merge request changes`);
      }
      
      // Get the diff refs to find the right blob SHA for line mapping
      // GitLab uses a specific blob SHA for line mapping that's different from file blob_id
      let blobSha: string | undefined;
      
      // Extract blob SHA from diff data - GitLab generates this internally
      // Try multiple methods to get the correct blob SHA
      if (fileChange.diff && fileChange.diff.includes('index ')) {
        // Try to extract from git diff header: "index oldsha..newsha mode"
        const indexMatch = fileChange.diff.match(/index ([a-f0-9]+)\.\.([a-f0-9]+)/);
        if (indexMatch) {
          // Use the new file SHA from the index line
          blobSha = indexMatch[2];
        }
      }
      
      // Fallback to blob_id from file change object
      if (!blobSha) {
        blobSha = fileChange.blob_id || fileChange.new_file?.blob_id || fileChange.old_file?.blob_id;
      }
      
      // If still no blob SHA, try to get it from the merge request diff_refs
      if (!blobSha) {
        const mrDetailsResponse = await context.axiosInstance.get(
          `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}`
        );
        blobSha = mrDetailsResponse.data.diff_refs?.head_sha;
      }
      
      if (!blobSha) {
        throw new Error(`Could not find blob SHA for file ${filePath}. Available data: ${JSON.stringify({
          blob_id: fileChange.blob_id,
          new_file: fileChange.new_file,
          old_file: fileChange.old_file,
          diff_preview: fileChange.diff?.substring(0, 200)
        })}`);
      }
      
      // Generate line_code using GitLab's format: {blob_sha}_{old_line}_{new_line}
      let lineCode: string;
      if (typedPosition.start_line && typedPosition.end_line) {
        // Multi-line comment - use end line for primary position  
        // Map start_line and end_line to old_line/new_line format for line_code
        const oldLineForEnd = typedPosition.old_line || null;
        const newLineForEnd = typedPosition.end_line;
        lineCode = `${blobSha}_${oldLineForEnd || 'null'}_${newLineForEnd}`;
        
        requestData.position = {
          ...typedPosition,
          new_line: typedPosition.end_line,
          line_code: lineCode
        };
        
        // Add line_range for multi-line using same blob SHA
        const startOldLine = typedPosition.old_line ? typedPosition.old_line - (typedPosition.end_line - typedPosition.start_line) : null;
        const startLineCode = `${blobSha}_${startOldLine || 'null'}_${typedPosition.start_line}`;
        const endLineCode = lineCode;
        
        requestData.position.line_range = {
          start: {
            line_code: startLineCode,
            type: 'new',
            old_line: startOldLine,
            new_line: typedPosition.start_line
          },
          end: {
            line_code: endLineCode,
            type: 'new',
            old_line: oldLineForEnd,
            new_line: typedPosition.end_line
          }
        };
      } else if (typedPosition.new_line && !typedPosition.old_line) {
        // Added line - format: {blob_sha}__{new_line} (GitLab uses empty string, not "null")
        lineCode = `${blobSha}__${typedPosition.new_line}`;
        requestData.position = {
          ...typedPosition,
          line_code: lineCode
        };
      } else if (typedPosition.old_line && !typedPosition.new_line) {
        // Removed line - format: {blob_sha}_{old_line}_ (GitLab uses empty string)
        lineCode = `${blobSha}_${typedPosition.old_line}_`;
        requestData.position = {
          ...typedPosition,
          line_code: lineCode
        };
      } else if (typedPosition.old_line && typedPosition.new_line) {
        // Unchanged line - format: {blob_sha}_{old_line}_{new_line}
        lineCode = `${blobSha}_${typedPosition.old_line}_${typedPosition.new_line}`;
        requestData.position = {
          ...typedPosition,
          line_code: lineCode
        };
      } else {
        // No specific line, just use the position as-is
        requestData.position = typedPosition;
      }
    } catch (error) {
      console.warn('Could not generate line_code for position:', error);
      // Fall back to position without line_code (will likely fail for line-specific comments)
      requestData.position = typedPosition;
    }
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/discussions`,
    requestData
  );
  return formatResponse(response.data);
};

/**
 * Reply to discussion handler
 */
export const replyToDiscussion: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, discussion_id, body } = params.arguments || {};
  if (!project_id || !merge_request_iid || !discussion_id || !body) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, discussion_id, and body are required');
  }
  
  const response = await context.axiosInstance.post(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/discussions/${discussion_id}/notes`,
    { body }
  );
  return formatResponse(response.data);
};

/**
 * Resolve discussion handler
 */
export const resolveDiscussion: ToolHandler = async (params, context) => {
  const { project_id, merge_request_iid, discussion_id, resolved } = params.arguments || {};
  if (!project_id || !merge_request_iid || !discussion_id || resolved === undefined) {
    throw new McpError(ErrorCode.InvalidParams, 'project_id, merge_request_iid, discussion_id, and resolved are required');
  }
  
  const response = await context.axiosInstance.put(
    `/projects/${encodeURIComponent(String(project_id))}/merge_requests/${merge_request_iid}/discussions/${discussion_id}`,
    { resolved: resolved === true }
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
 * Get project ID from git remote URL handler
 */
export const getProjectId: ToolHandler = async (params) => {
  const { remote_url } = params.arguments || {};
  if (!remote_url) {
    throw new McpError(ErrorCode.InvalidParams, 'remote_url is required');
  }

  const url = String(remote_url);
  
  // Handle SSH format: git@gitlab.com:group/project.git
  const sshMatch = url.match(/git@([^:]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, host, path] = sshMatch;
    return formatResponse({
      project_id: path,
      host: host,
      full_url: `https://${host}/${path}`
    });
  }
  
  // Handle HTTPS format: https://gitlab.com/group/project.git
  const httpsMatch = url.match(/https?:\/\/([^\/]+)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    const [, host, path] = httpsMatch;
    return formatResponse({
      project_id: path,
      host: host,
      full_url: `https://${host}/${path}`
    });
  }
  
  throw new McpError(ErrorCode.InvalidParams, 'Invalid GitLab remote URL format. Expected formats: git@gitlab.com:group/project.git or https://gitlab.com/group/project.git');
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