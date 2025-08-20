#!/usr/bin/env node

/**
 * Analyze all GitLab MCP tools to check if readOnlyHint is set properly
 */

import fs from 'fs';
import path from 'path';

const toolFiles = [
  'src/tools/definitions/repository.ts',
  'src/tools/definitions/issues.ts', 
  'src/tools/definitions/merge-requests.ts',
  'src/tools/definitions/ci-cd.ts',
  'src/tools/definitions/integrations.ts',
  'src/tools/definitions/users-groups.ts',
  'src/tools/definitions/index.ts'
];

function analyzeTools() {
  const results = [];
  
  for (const file of toolFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Split into tool objects by looking for tool boundaries
    const toolObjects = content.split(/(?=\s*{\s*name:)/);
    
    for (const toolObj of toolObjects) {
      // Find tool name
      const nameMatch = toolObj.match(/name:\s*['"`]([^'"`]+)['"`]/);
      if (!nameMatch) continue;
      
      const toolName = nameMatch[1];
      if (!toolName.startsWith('gitlab_')) continue;
      
      // Find readOnlyHint
      const readOnlyMatch = toolObj.match(/readOnlyHint:\s*(true|false)/);
      if (!readOnlyMatch) {
        console.log(`⚠️  Warning: ${toolName} has no readOnlyHint annotation`);
        continue;
      }
      
      const readOnlyHint = readOnlyMatch[1] === 'true';
      
      // Categorize based on operation type
      let expectedReadOnly = true;
      if (toolName.includes('create_') || 
          toolName.includes('update_') || 
          toolName.includes('delete_') || 
          toolName.includes('add_') ||
          toolName.includes('trigger_') ||
          toolName.includes('retry_') ||
          toolName.includes('merge_') ||
          toolName.includes('mark_') ||
          toolName.includes('resolve_') ||
          toolName.includes('reply_') ||
          toolName.includes('disable_') ||
          toolName.includes('test_')) {
        expectedReadOnly = false;
      }
      
      results.push({
        tool: toolName,
        file: path.basename(file),
        actualReadOnly: readOnlyHint,
        expectedReadOnly: expectedReadOnly,
        correct: readOnlyHint === expectedReadOnly
      });
    }
  }
  
  return results;
}

function main() {
  console.log('🔍 Analyzing GitLab MCP Tools - readOnlyHint Settings');
  console.log('=====================================================\n');
  
  const results = analyzeTools();
  const incorrect = results.filter(r => !r.correct);
  const correct = results.filter(r => r.correct);
  
  if (incorrect.length > 0) {
    console.log('❌ INCORRECT readOnlyHint Settings:');
    console.log('-----------------------------------');
    incorrect.forEach(tool => {
      console.log(`${tool.tool}`);
      console.log(`  File: ${tool.file}`);
      console.log(`  Current: readOnlyHint: ${tool.actualReadOnly}`);
      console.log(`  Expected: readOnlyHint: ${tool.expectedReadOnly}`);
      console.log(`  Reason: ${getOperationType(tool.tool)} operation should be ${tool.expectedReadOnly ? 'read-only' : 'writable'}`);
      console.log('');
    });
  } else {
    console.log('✅ All readOnlyHint settings are correct!');
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total tools: ${results.length}`);
  console.log(`   Correct: ${correct.length}`);
  console.log(`   Incorrect: ${incorrect.length}`);
  
  if (incorrect.length > 0) {
    console.log('\n🔧 Tools needing fixes:');
    incorrect.forEach(tool => {
      console.log(`   ${tool.tool}: readOnlyHint should be ${tool.expectedReadOnly}`);
    });
  }
  
  // Group by operation type
  console.log('\n📝 Tools by Operation Type:');
  console.log('---------------------------');
  
  const readOps = results.filter(r => r.expectedReadOnly);
  const writeOps = results.filter(r => !r.expectedReadOnly);
  
  console.log(`\n📖 Read Operations (${readOps.length}) - should have readOnlyHint: true:`);
  readOps.forEach(tool => {
    const status = tool.correct ? '✅' : '❌';
    console.log(`   ${status} ${tool.tool} (${tool.actualReadOnly})`);
  });
  
  console.log(`\n✏️  Write Operations (${writeOps.length}) - should have readOnlyHint: false:`);
  writeOps.forEach(tool => {
    const status = tool.correct ? '✅' : '❌';
    console.log(`   ${status} ${tool.tool} (${tool.actualReadOnly})`);
  });
}

function getOperationType(toolName) {
  if (toolName.includes('list_') || 
      toolName.includes('get_') ||
      toolName.includes('compare_')) {
    return 'Read';
  } else {
    return 'Write';
  }
}

main();