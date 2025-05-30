/**
 * File and repository content handler functions
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

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