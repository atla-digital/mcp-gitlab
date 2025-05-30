/**
 * Consolidated tool definitions export
 */

import { repositoryToolDefinitions } from './repository.js';
import { mergeRequestToolDefinitions } from './merge-requests.js';
import { issueToolDefinitions } from './issues.js';
import { cicdToolDefinitions } from './ci-cd.js';
import { integrationToolDefinitions } from './integrations.js';
import { usersGroupsToolDefinitions } from './users-groups.js';

/**
 * All tool definitions combined
 */
export const toolDefinitions = [
  ...repositoryToolDefinitions,
  ...mergeRequestToolDefinitions,
  ...issueToolDefinitions,
  ...cicdToolDefinitions,
  ...integrationToolDefinitions,
  ...usersGroupsToolDefinitions
];

// Export individual category arrays for easier selection
export {
  repositoryToolDefinitions,
  mergeRequestToolDefinitions,
  issueToolDefinitions,
  cicdToolDefinitions,
  integrationToolDefinitions,
  usersGroupsToolDefinitions
};