#!/usr/bin/env node

/**
 * Systematically add comprehensive annotations to ALL GitLab MCP tools
 */

import fs from 'fs';

// Define all tool files and their expected tools
const toolDefinitions = {
  'src/tools/definitions/merge-requests.ts': [
    { name: 'gitlab_list_merge_requests', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_merge_request', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_merge_request_changes', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_create_merge_request_note', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_create_merge_request_note_internal', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_list_merge_request_discussions', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_merge_request_discussion', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_create_merge_request_discussion', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_reply_to_discussion', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_resolve_discussion', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_create_merge_request', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_update_merge_request', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_mark_merge_request_ready', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_merge_merge_request', readOnly: false, destructive: true, idempotent: false }
  ],
  
  'src/tools/definitions/ci-cd.ts': [
    { name: 'gitlab_list_pipelines', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_pipeline', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_pipeline_jobs', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_job_log', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_retry_job', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_list_trigger_tokens', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_trigger_token', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_create_trigger_token', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_update_trigger_token', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_delete_trigger_token', readOnly: false, destructive: true, idempotent: false },
    { name: 'gitlab_trigger_pipeline', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_list_cicd_variables', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_cicd_variable', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_create_cicd_variable', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_update_cicd_variable', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_delete_cicd_variable', readOnly: false, destructive: true, idempotent: false }
  ],
  
  'src/tools/definitions/integrations.ts': [
    { name: 'gitlab_list_integrations', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_integration', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_update_slack_integration', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_disable_slack_integration', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_list_webhooks', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_webhook', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_add_webhook', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_update_webhook', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_delete_webhook', readOnly: false, destructive: true, idempotent: false },
    { name: 'gitlab_test_webhook', readOnly: false, destructive: false, idempotent: false }
  ],
  
  'src/tools/definitions/users-groups.ts': [
    { name: 'gitlab_list_users', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_current_user', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_user', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_list_groups', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_group', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_list_group_members', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_add_group_member', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_list_project_members', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_add_project_member', readOnly: false, destructive: false, idempotent: false }
  ]
};

// Add missing annotations to repository.ts and issues.ts tools
const additionalDefinitions = {
  'src/tools/definitions/repository.ts': [
    { name: 'gitlab_list_branches', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_repository_file', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_compare_branches', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_get_project_id', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_create_branch', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_delete_branch', readOnly: false, destructive: true, idempotent: false }
  ],
  
  'src/tools/definitions/issues.ts': [
    { name: 'gitlab_get_issue', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_update_issue', readOnly: false, destructive: false, idempotent: true },
    { name: 'gitlab_list_issue_links', readOnly: true, destructive: false, idempotent: true },
    { name: 'gitlab_create_issue_link', readOnly: false, destructive: false, idempotent: false },
    { name: 'gitlab_delete_issue_link', readOnly: false, destructive: true, idempotent: false }
  ],
  
  'src/tools/definitions/index.ts': [
    { name: 'gitlab_get_prompt', readOnly: true, destructive: false, idempotent: true }
  ]
};

// Merge all definitions
Object.assign(toolDefinitions, additionalDefinitions);

function addAnnotationsToTool(content, toolName, annotations) {
  // Find the tool definition and add annotations if missing
  const toolRegex = new RegExp(`(\\s*{\\s*name:\\s*['"\`]${toolName}['"\`][\\s\\S]*?)(\n\\s*}(?:\\s*,\\s*(?={)|(?=\\s*\\];?)))`, 'm');
  
  const match = content.match(toolRegex);
  if (!match) return content;
  
  const toolBody = match[1];
  const closing = match[2];
  
  // Check if annotations already exist
  if (toolBody.includes('annotations:')) {
    console.log(`   ✅ '${toolName}' already has annotations`);
    return content;
  }
  
  console.log(`   🔧 Adding annotations to '${toolName}' (readOnly: ${annotations.readOnly}, destructive: ${annotations.destructive}, idempotent: ${annotations.idempotent})`);
  
  // Add annotations before the closing brace
  const annotationText = `,
    annotations: {
      readOnlyHint: ${annotations.readOnly},
      destructiveHint: ${annotations.destructive},
      idempotentHint: ${annotations.idempotent}
    }`;
  
  const newContent = toolBody + annotationText + closing;
  return content.replace(toolRegex, newContent);
}

function processFile(filePath, tools) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  console.log(`\n📝 Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const tool of tools) {
    const originalContent = content;
    content = addAnnotationsToTool(content, tool.name, {
      readOnly: tool.readOnly,
      destructive: tool.destructive,
      idempotent: tool.idempotent
    });
    
    if (content !== originalContent) {
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Updated ${filePath}`);
    return true;
  } else {
    console.log(`   ℹ️  No changes needed for ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🔧 Adding Comprehensive Annotations to ALL GitLab MCP Tools');
  console.log('=============================================================');
  console.log('Legend:');
  console.log('• readOnlyHint: true = safe read operations, false = write operations'); 
  console.log('• destructiveHint: true = permanently removes/alters data');
  console.log('• idempotentHint: true = safe to repeat, false = creates new resources');
  console.log('=============================================================');
  
  let processedFiles = 0;
  let modifiedFiles = 0;
  let totalTools = 0;
  
  for (const [filePath, tools] of Object.entries(toolDefinitions)) {
    processedFiles++;
    totalTools += tools.length;
    
    const wasModified = processFile(filePath, tools);
    if (wasModified) modifiedFiles++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${processedFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Total tools annotated: ${totalTools}`);
  
  console.log(`\n🔍 Next steps:`);
  console.log(`   1. Test build: npm run build`);
  console.log(`   2. Analyze results: node analyze-tools.js`);
  console.log(`   3. Deploy: docker compose up --build -d`);
}

main();