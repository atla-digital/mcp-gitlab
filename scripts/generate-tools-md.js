#!/usr/bin/env node

/**
 * Script to convert src/utils/tools-data.ts to TOOLS.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read tools definitions from the built version
const toolsDataPath = path.resolve(__dirname, '../build/tools/definitions/index.js');
const outputPath = path.resolve(__dirname, '../TOOLS.md');

// Convert heading text to GitHub-compatible anchor
function generateAnchor(text) {
  // Hard-coded anchors for specific categories
  if (text === 'Integrations & Webhooks') {
    return 'integrations--webhooks';
  } else if (text === 'User & Group Management') {
    return 'user--group-management';
  }
  
  // Generic anchor generation for other categories
  return text
    .toLowerCase()
    .replace(/[\/]/g, '')     // Remove forward slashes
    .replace(/\s+/g, '-');    // Replace spaces with hyphens
}

async function generateToolsMarkdown() {
  try {
    // Import the consolidated tool definitions dynamically
    const toolsModule = await import(pathToFileURL(toolsDataPath).href);
  const toolDefinitions = toolsModule.toolDefinitions;
  
  if (!toolDefinitions || !Array.isArray(toolDefinitions)) {
    console.error('Could not load tool definitions from consolidated exports');
    process.exit(1);
  }
  
  // Convert tool definition objects to the format expected by the markdown generator
  const tools = toolDefinitions.map(tool => {
    const parameters = [];
    
    if (tool.inputSchema && tool.inputSchema.properties) {
      const required = tool.inputSchema.required || [];
      
      for (const [paramName, paramDef] of Object.entries(tool.inputSchema.properties)) {
        parameters.push({
          name: paramName,
          type: paramDef.type,
          description: paramDef.description || '',
          required: required.includes(paramName),
          default: paramDef.default
        });
      }
    }
    
    return {
      name: tool.name,
      description: tool.description,
      parameters
    };
  });
  
  // Generate markdown content
  let markdown = '# GitLab MCP Server Tools\n\n';
  markdown += 'This document provides details on all available tools in the GitLab MCP server.\n\n';
  markdown += 'Each tool is designed to interact with GitLab APIs, allowing AI assistants to work with repositories, merge requests, issues, CI/CD pipelines, and more.\n\n';
  
  // Group tools by category based on name prefix
  const categories = {
    'Repository Management': tools.filter(t => 
      t.name.includes('project') || 
      t.name.includes('branch') || 
      t.name.includes('merge_request') || 
      t.name.includes('issue') || 
      t.name.includes('repository')),
    'Integrations & Webhooks': tools.filter(t => 
      t.name.includes('integration') || 
      t.name.includes('webhook')),
    'CI/CD Management': tools.filter(t => 
      t.name.includes('trigger') || 
      t.name.includes('pipeline') || 
      t.name.includes('cicd')),
    'User & Group Management': tools.filter(t => 
      t.name.includes('user') || 
      t.name.includes('group') || 
      t.name.includes('member'))
  };
  
  // Generate table of contents
  markdown += '## Table of Contents\n\n';
  Object.keys(categories).forEach(category => {
    const anchor = generateAnchor(category);
    markdown += `- [${category}](#${anchor})\n`;
  });
  markdown += '\n';
  
  // Generate tool documentation by category
  Object.entries(categories).forEach(([category, categoryTools]) => {
    markdown += `## ${category}\n\n`;
    
    categoryTools.forEach(tool => {
      markdown += `### ${tool.name}\n\n`;
      markdown += `${tool.description}\n\n`;
      
      if (tool.parameters.length > 0) {
        markdown += '**Parameters:**\n\n';
        markdown += '| Name | Type | Required | Description | Default |\n';
        markdown += '| ---- | ---- | -------- | ----------- | ------- |\n';
        
        tool.parameters.forEach(param => {
          const defaultValue = param.default !== undefined ? `\`${param.default}\`` : '-';
          markdown += `| \`${param.name}\` | \`${param.type}\` | ${param.required ? 'Yes' : 'No'} | ${param.description} | ${defaultValue} |\n`;
        });
        
        markdown += '\n';
      } else {
        markdown += 'This tool does not require any parameters.\n\n';
      }
    });
  });
  
  // Add footer
  markdown += '---\n\n';
  markdown += 'Generated automatically from `src/tools/definitions/`\n';
  
  // Write to TOOLS.md
  fs.writeFileSync(outputPath, markdown);
  console.log(`Successfully generated ${outputPath}`);
  
  } catch (error) {
    console.error('Error generating markdown:', error);
    process.exit(1);
  }
}

// Run the function
generateToolsMarkdown();