/**
 * Tool definitions for GitLab MCP Server
 * Re-exports from organized definition files
 */

// Import from the new organized structure
export { toolDefinitions } from '../tools/definitions/index.js';

// Keep legacy exports for backward compatibility
export { repositoryToolDefinitions as repositoryTools } from '../tools/definitions/repository.js';
export { integrationToolDefinitions as integrationTools } from '../tools/definitions/integrations.js';
export { cicdToolDefinitions as cicdTools } from '../tools/definitions/ci-cd.js';
export { usersGroupsToolDefinitions as usersGroupsTools } from '../tools/definitions/users-groups.js'; 