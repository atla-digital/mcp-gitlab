/**
 * Workflow prompt handlers
 * Handles retrieval and processing of workflow prompt templates
 */

import { ToolHandler } from '../utils/handler-types.js';
import { formatResponse } from '../utils/response-formatter.js';
import { promptTemplates } from '../utils/prompts-data.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Get a workflow prompt template with parameter substitution
 */
export const getPrompt: ToolHandler = async params => {
  const { name, arguments: promptArgs = {} } = params.arguments || {};

  if (!name || typeof name !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'name parameter is required and must be a string');
  }

  const template = promptTemplates[name as string];
  if (!template) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Prompt "${name}" not found. Available prompts: ${Object.keys(promptTemplates).join(', ')}`
    );
  }

  // Ensure promptArgs is an object
  const args =
    promptArgs && typeof promptArgs === 'object' && !Array.isArray(promptArgs)
      ? (promptArgs as Record<string, any>)
      : {};

  // Substitute template parameters
  let processedTemplate = template;

  // Handle {{additional_instructions}} parameter
  if (args.additional_instructions && typeof args.additional_instructions === 'string') {
    const instructionsSection = `
## Additional Instructions

${args.additional_instructions}

---
`;
    processedTemplate = processedTemplate.replace(
      '{{additional_instructions}}',
      instructionsSection
    );
  } else {
    // Remove the placeholder if no additional instructions provided
    processedTemplate = processedTemplate.replace('{{additional_instructions}}', '');
  }

  // Handle any other template parameters that might be added in the future
  for (const [key, value] of Object.entries(args)) {
    if (key !== 'additional_instructions') {
      const placeholder = `{{${key}}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), String(value));
    }
  }

  return formatResponse({
    name,
    content: processedTemplate,
    parameters_substituted: args,
    message:
      'Workflow prompt retrieved successfully. Use this content to resume or continue your workflow.',
  });
};
