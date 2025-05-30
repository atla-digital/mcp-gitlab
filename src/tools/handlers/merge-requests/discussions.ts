/**
 * Merge request discussions and line-specific comments handlers
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

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