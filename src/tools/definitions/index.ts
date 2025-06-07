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
 * Workflow prompt tool definition
 */
const promptToolDefinition = {
  name: 'gitlab_get_prompt',
  description: 'Get a specific workflow prompt template with parameters substituted. Essential for workflow resumption after context compaction.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the prompt to retrieve (e.g., "analyze-issue", "work-on-mr", "code-review")',
        enum: ['analyze-issue', 'work-on-mr', 'code-review']
      },
      arguments: {
        type: 'object',
        description: 'Optional arguments to substitute in the prompt template (e.g., {"additional_instructions": "focus on security"})',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['name']
  }
};

/**
 * All tool definitions combined
 */
export const toolDefinitions = [
  ...repositoryToolDefinitions,
  ...mergeRequestToolDefinitions,
  ...issueToolDefinitions,
  ...cicdToolDefinitions,
  ...integrationToolDefinitions,
  ...usersGroupsToolDefinitions,
  promptToolDefinition
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