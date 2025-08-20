#!/usr/bin/env node

/**
 * Script to add missing readOnlyHint annotations to all GitLab MCP tools
 */

import fs from 'fs';
import path from 'path';

const toolFiles = [
  'src/tools/definitions/repository.ts',
  'src/tools/definitions/issues.ts', 
  'src/tools/definitions/merge-requests.ts',
  'src/tools/definitions/ci-cd.ts',
  'src/tools/definitions/integrations.ts',
  'src/tools/definitions/users-groups.ts'
];

function isWriteOperation(toolName) {
  // Explicitly list read operations that might be misclassified
  const readOperations = [
    'list_', 'get_', 'compare_'
  ];
  
  // If it's clearly a read operation, return false
  if (readOperations.some(op => toolName.includes(op))) {
    return false;
  }
  
  const writeOperations = [
    'create_', 'update_', 'delete_', 'add_', 'trigger_', 
    'retry_', 'merge_', 'mark_', 'resolve_', 'reply_', 
    'disable_', 'test_'
  ];
  
  return writeOperations.some(op => toolName.includes(op));
}

function addAnnotationsToFile(filePath) {
  console.log(`\n📝 Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let toolCount = 0;
  
  // Find tool objects and add missing annotations
  const toolPattern = /(\s*{\s*name:\s*['"`]gitlab_[^'"`]+['"`][\s\S]*?)(\s*}\s*(?:,\s*(?=\s*{\s*name)|\s*\]\s*;?\s*$))/g;
  
  content = content.replace(toolPattern, (match, toolBody, closing) => {
    toolCount++;
    
    // Check if annotations already exist
    if (toolBody.includes('annotations:')) {
      console.log(`   ✅ Tool already has annotations (skipping)`);
      return match;
    }
    
    // Extract tool name
    const nameMatch = toolBody.match(/name:\s*['"`]([^'"`]+)['"`]/);
    if (!nameMatch) return match;
    
    const toolName = nameMatch[1];
    const isReadOnly = !isWriteOperation(toolName);
    
    console.log(`   🔧 Adding annotations to ${toolName} (readOnly: ${isReadOnly})`);
    
    // Add annotations before closing brace
    const annotations = `    annotations: {
      readOnlyHint: ${isReadOnly},
      destructiveHint: false,
      idempotentHint: ${isReadOnly}
    }`;
    
    // Insert annotations before the closing brace
    const lastBraceIndex = toolBody.lastIndexOf('}');
    if (lastBraceIndex === -1) return match;
    
    const beforeBrace = toolBody.substring(0, lastBraceIndex);
    const afterBrace = toolBody.substring(lastBraceIndex);
    
    // Check if there's a comma after the last property
    const needsComma = !beforeBrace.trim().endsWith(',') && !beforeBrace.trim().endsWith('{');
    const comma = needsComma ? ',' : '';
    
    const newToolBody = beforeBrace + comma + '\n    ' + annotations + '\n  ' + afterBrace;
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
  console.log('🔧 Adding Missing readOnlyHint Annotations to GitLab MCP Tools');
  console.log('==============================================================');
  
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
  console.log(`\n✅ All missing readOnlyHint annotations have been added!`);
  console.log(`\n🔍 Next steps:`);
  console.log(`   1. Review the changes with: git diff`);
  console.log(`   2. Test the build with: npm run build`);
  console.log(`   3. Verify with: node analyze-tools.js`);
}

main();