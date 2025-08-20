#!/usr/bin/env node

/**
 * Script to add comprehensive MCP annotations to all GitLab tools
 * Annotations: readOnlyHint, destructiveHint, idempotentHint
 */

import fs from 'fs';
import path from 'path';

const toolFiles = [
  'src/tools/definitions/merge-requests.ts',
  'src/tools/definitions/ci-cd.ts',
  'src/tools/definitions/integrations.ts',
  'src/tools/definitions/users-groups.ts'
];

function classifyTool(toolName, description = '') {
  // Destructive operations that permanently remove/change data
  const destructiveOperations = [
    'delete_', 'remove_', 'disable_', 'merge_merge_request'
  ];
  
  // Read operations - safe, no side effects
  const readOperations = [
    'list_', 'get_', 'compare_'
  ];
  
  // Write operations that are idempotent (can be repeated safely)  
  const idempotentWriteOperations = [
    'update_', 'mark_merge_request_ready', 'resolve_discussion'
  ];
  
  // Write operations that are NOT idempotent (create new resources)
  const nonIdempotentWriteOperations = [
    'create_', 'add_', 'trigger_', 'retry_', 'reply_', 'test_'
  ];

  const isRead = readOperations.some(op => toolName.includes(op));
  const isDestructive = destructiveOperations.some(op => toolName.includes(op));
  const isIdempotentWrite = idempotentWriteOperations.some(op => toolName.includes(op));
  const isNonIdempotentWrite = nonIdempotentWriteOperations.some(op => toolName.includes(op));

  if (isRead) {
    return {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      reasoning: 'Read operation - safe and repeatable'
    };
  }
  
  if (isDestructive) {
    return {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      reasoning: 'Destructive operation - permanently alters/removes data'
    };
  }
  
  if (isIdempotentWrite) {
    return {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      reasoning: 'Idempotent write - safe to repeat'
    };
  }
  
  if (isNonIdempotentWrite) {
    return {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      reasoning: 'Non-idempotent write - creates new resources'
    };
  }

  // Default for unclear cases
  return {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    reasoning: 'Default classification - needs manual review'
  };
}

function addAnnotationsToFile(filePath) {
  console.log(`\n📝 Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let toolCount = 0;
  
  // Match tool objects - more precise regex
  const toolPattern = /({\s*name:\s*['"`]gitlab_[^'"`]+['"`](?:(?!^\s*},?\s*{).|\n)*?)(}\s*(?:,\s*(?=\s*{)|(?=\s*\];?\s*$)))/gm;
  
  content = content.replace(toolPattern, (match, toolBody, closing) => {
    toolCount++;
    
    // Check if annotations already exist
    if (toolBody.includes('annotations:')) {
      const nameMatch = toolBody.match(/name:\s*['"`]([^'"`]+)['"`]/);
      const toolName = nameMatch ? nameMatch[1] : 'unknown';
      console.log(`   ✅ Tool '${toolName}' already has annotations (skipping)`);
      return match;
    }
    
    // Extract tool name and description
    const nameMatch = toolBody.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const descMatch = toolBody.match(/description:\s*['"`]([^'"`]+)['"`]/);
    
    if (!nameMatch) return match;
    
    const toolName = nameMatch[1];
    const description = descMatch ? descMatch[1] : '';
    const classification = classifyTool(toolName, description);
    
    console.log(`   🔧 Adding annotations to '${toolName}'`);
    console.log(`      → ${classification.reasoning}`);
    console.log(`      → readOnly: ${classification.readOnlyHint}, destructive: ${classification.destructiveHint}, idempotent: ${classification.idempotentHint}`);
    
    // Add annotations before closing brace
    const annotations = `  },
  annotations: {
    readOnlyHint: ${classification.readOnlyHint},
    destructiveHint: ${classification.destructiveHint},
    idempotentHint: ${classification.idempotentHint}
  }`;
    
    // Replace the closing brace
    const newToolBody = toolBody + annotations;
    modified = true;
    
    return newToolBody + closing;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Updated ${toolCount} tools in ${path.basename(filePath)}`);
  } else {
    console.log(`   ℹ️  No changes needed for ${path.basename(filePath)}`);
  }
  
  return { modified, toolCount };
}

function main() {
  console.log('🔧 Adding Comprehensive MCP Annotations to GitLab Tools');
  console.log('======================================================');
  console.log('Annotations being added:');
  console.log('• readOnlyHint: true for read operations, false for writes');
  console.log('• destructiveHint: true for delete/disable operations');
  console.log('• idempotentHint: true for safe-to-repeat operations');
  console.log('======================================================');
  
  let totalTools = 0;
  let modifiedFiles = 0;
  
  for (const filePath of toolFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    const result = addAnnotationsToFile(filePath);
    totalTools += result.toolCount;
    if (result.modified) modifiedFiles++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${toolFiles.length}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Total tools processed: ${totalTools}`);
  console.log(`\n✅ All comprehensive annotations have been added!`);
  console.log(`\n🔍 Next steps:`);
  console.log(`   1. Review the changes with: git diff`);
  console.log(`   2. Test the build with: npm run build`);
  console.log(`   3. Verify with: node analyze-tools.js`);
}

main();