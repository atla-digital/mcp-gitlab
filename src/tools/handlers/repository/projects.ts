/**
 * Project-related handler functions
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../../utils/handler-types.js";
import { formatResponse } from "../../../utils/response-formatter.js";

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