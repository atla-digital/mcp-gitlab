#!/usr/bin/env node
/**
 * Tool Execution Testing
 * Tests actual tool execution and response format validation
 * This test would have caught the double-wrapping bug in tools/call responses
 */

import { randomUUID } from 'crypto';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

class ToolExecutionTest {
  constructor() {
    this.results = [];
    this.testToken = process.env.TEST_GITLAB_TOKEN || 'glpat-test-exec-' + randomUUID().substring(0, 8);
    this.testGitlabUrl = process.env.TEST_GITLAB_URL || 'https://gitlab.com/api/v4';
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
    this.results.push({ timestamp, message, data });
  }

  async createClient() {
    return axios.create({
      baseURL: MCP_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-GitLab-Token': this.testToken,
        'X-GitLab-URL': this.testGitlabUrl,
      },
      timeout: 15000,
    });
  }

  async sendRequest(client, method, params = {}, sessionId = null) {
    const headers = { ...client.defaults.headers };
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    const response = await client.post('', {
      jsonrpc: '2.0',
      id: randomUUID(),
      method,
      params,
    }, { headers });

    // Extract JSON from SSE format if needed
    if (typeof response.data === 'string' && response.data.includes('data: ')) {
      const dataLine = response.data.split('\n').find(line => line.startsWith('data: '));
      if (dataLine) {
        return JSON.parse(dataLine.substring(6));
      }
    }
    return response.data;
  }

  async testToolExecutionResponseFormat() {
    await this.log('Testing tool execution response format validation...');
    const client = await this.createClient();
    const tests = [];

    try {
      // Initialize session first
      const initResponse = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canCallTools: true },
        clientInfo: { name: 'tool-execution-test', version: '1.0.0' },
      });

      const sessionId = initResponse.result?.sessionId;
      if (!sessionId) {
        tests.push({
          name: 'Session initialization for tool execution',
          passed: false,
          error: 'Failed to get session ID'
        });
        return tests;
      }

      // Test 1: Basic tool execution with response format validation
      try {
        const toolCallResponse = await this.sendRequest(client, 'tools/call', {
          name: 'gitlab_get_project_id',
          arguments: {
            remote_url: 'https://gitlab.example.com/test/repo.git'
          }
        }, sessionId);

        // Validate JSON-RPC structure
        const hasJsonRpc = toolCallResponse.jsonrpc === '2.0';
        const hasId = toolCallResponse.hasOwnProperty('id');
        const hasResult = toolCallResponse.hasOwnProperty('result');

        tests.push({
          name: 'Tool execution JSON-RPC structure',
          passed: hasJsonRpc && hasId && hasResult,
          details: {
            hasJsonRpc,
            hasId,
            hasResult,
            responseKeys: Object.keys(toolCallResponse)
          }
        });

        // Critical test: Validate MCP tool response format
        const result = toolCallResponse.result;
        const hasContent = result && result.hasOwnProperty('content');
        const contentIsArray = hasContent && Array.isArray(result.content);
        
        // This would have caught the double-wrapping bug!
        const hasDoubleWrapping = hasContent && result.content && result.content.hasOwnProperty('content');
        
        tests.push({
          name: 'MCP tool response format (no double-wrapping)',
          passed: hasContent && contentIsArray && !hasDoubleWrapping,
          details: {
            hasContent,
            contentIsArray,
            hasDoubleWrapping: hasDoubleWrapping,
            resultKeys: result ? Object.keys(result) : [],
            contentType: hasContent ? typeof result.content : 'none',
            firstContentItem: contentIsArray && result.content.length > 0 ? 
              Object.keys(result.content[0]) : []
          }
        });

        // Test content item structure
        if (contentIsArray && result.content.length > 0) {
          const firstItem = result.content[0];
          const hasType = firstItem.hasOwnProperty('type');
          const hasText = firstItem.hasOwnProperty('text');
          const typeIsText = firstItem.type === 'text';

          tests.push({
            name: 'Content item structure validation',
            passed: hasType && hasText && typeIsText,
            details: {
              hasType,
              hasText,
              typeIsText,
              actualType: firstItem.type,
              contentItemKeys: Object.keys(firstItem)
            }
          });
        }

        // Test structured content (if present)
        if (result.hasOwnProperty('structuredContent')) {
          const structuredContent = result.structuredContent;
          const isObject = structuredContent && typeof structuredContent === 'object';
          const notArray = !Array.isArray(structuredContent);

          tests.push({
            name: 'Structured content format',
            passed: isObject && notArray,
            details: {
              isObject,
              notArray,
              structuredContentType: typeof structuredContent,
              structuredContentKeys: isObject ? Object.keys(structuredContent) : []
            }
          });
        }

      } catch (error) {
        tests.push({
          name: 'Tool execution response format',
          passed: false,
          error: error.message,
          details: {
            errorType: error.constructor.name,
            statusCode: error.response?.status
          }
        });
      }

    } catch (error) {
      tests.push({
        name: 'Tool execution test setup',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testMultipleToolExecution() {
    await this.log('Testing multiple tool execution consistency...');
    const client = await this.createClient();
    const tests = [];

    try {
      // Initialize session
      const initResponse = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canCallTools: true },
        clientInfo: { name: 'multi-tool-test', version: '1.0.0' },
      });

      const sessionId = initResponse.result?.sessionId;
      if (!sessionId) {
        tests.push({
          name: 'Multi-tool test session initialization',
          passed: false,
          error: 'Failed to get session ID'
        });
        return tests;
      }

      // Test different types of tools to ensure consistent response format
      const toolTests = [
        {
          name: 'gitlab_get_project_id',
          args: { remote_url: 'https://gitlab.example.com/test/repo.git' }
        },
        {
          name: 'gitlab_list_projects',
          args: { per_page: 5 }
        }
      ];

      let allFormatsConsistent = true;
      const formatDetails = [];

      for (const toolTest of toolTests) {
        try {
          const response = await this.sendRequest(client, 'tools/call', {
            name: toolTest.name,
            arguments: toolTest.args
          }, sessionId);

          const hasContent = response.result && response.result.hasOwnProperty('content');
          const contentIsArray = hasContent && Array.isArray(response.result.content);
          const hasDoubleWrapping = hasContent && response.result.content && 
            response.result.content.hasOwnProperty('content');

          const isConsistent = hasContent && contentIsArray && !hasDoubleWrapping;
          if (!isConsistent) allFormatsConsistent = false;

          formatDetails.push({
            toolName: toolTest.name,
            hasContent,
            contentIsArray,
            hasDoubleWrapping,
            isConsistent
          });

        } catch (error) {
          formatDetails.push({
            toolName: toolTest.name,
            error: error.message,
            isConsistent: false
          });
          allFormatsConsistent = false;
        }
      }

      tests.push({
        name: 'Multiple tool execution format consistency',
        passed: allFormatsConsistent,
        details: {
          allFormatsConsistent,
          testedTools: toolTests.length,
          formatDetails
        }
      });

    } catch (error) {
      tests.push({
        name: 'Multiple tool execution test',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testToolErrorHandling() {
    await this.log('Testing tool error response format...');
    const client = await this.createClient();
    const tests = [];

    try {
      // Initialize session
      const initResponse = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canCallTools: true },
        clientInfo: { name: 'error-test', version: '1.0.0' },
      });

      const sessionId = initResponse.result?.sessionId;

      // Test invalid tool call
      try {
        await this.sendRequest(client, 'tools/call', {
          name: 'nonexistent_tool',
          arguments: {}
        }, sessionId);

        tests.push({
          name: 'Invalid tool error handling',
          passed: false,
          details: 'Should have thrown an error'
        });

      } catch (error) {
        // Error is expected - check if it's properly formatted
        const isProperError = error.response?.status >= 400;
        tests.push({
          name: 'Invalid tool error handling',
          passed: isProperError,
          details: {
            statusCode: error.response?.status,
            hasErrorMessage: !!error.message
          }
        });
      }

      // Test tool call with missing arguments
      try {
        await this.sendRequest(client, 'tools/call', {
          name: 'gitlab_get_project_id',
          arguments: {} // Missing required remote_url
        }, sessionId);

        tests.push({
          name: 'Missing arguments error handling',
          passed: false,
          details: 'Should have thrown an error'
        });

      } catch (error) {
        const isProperError = error.response?.status >= 400;
        tests.push({
          name: 'Missing arguments error handling',
          passed: isProperError,
          details: {
            statusCode: error.response?.status,
            hasErrorMessage: !!error.message
          }
        });
      }

    } catch (error) {
      tests.push({
        name: 'Tool error handling test setup',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async runAllTests() {
    console.log('🔧 Starting Tool Execution Tests\n');
    
    const testSuites = [
      { name: 'Tool Response Format Validation', test: () => this.testToolExecutionResponseFormat() },
      { name: 'Multiple Tool Execution Consistency', test: () => this.testMultipleToolExecution() },
      { name: 'Tool Error Handling', test: () => this.testToolErrorHandling() },
    ];

    const allResults = {};
    let totalPassed = 0;
    let totalTests = 0;

    for (const suite of testSuites) {
      try {
        await this.log(`\n--- ${suite.name} ---`);
        const results = await suite.test();
        allResults[suite.name] = results;
        
        const suitePassed = results.filter(r => r.passed).length;
        const suiteTotal = results.length;
        totalPassed += suitePassed;
        totalTests += suiteTotal;
        
        await this.log(`${suite.name}: ${suitePassed}/${suiteTotal} tests passed`);
        
      } catch (error) {
        await this.log(`${suite.name} failed with error: ${error.message}`);
        allResults[suite.name] = [{ name: suite.name, passed: false, error: error.message }];
        totalTests += 1;
      }
    }

    this.printResults(allResults, totalPassed, totalTests);
    return { passed: totalPassed, total: totalTests, success: totalPassed === totalTests };
  }

  printResults(allResults, totalPassed, totalTests) {
    console.log('\n📋 Tool Execution Test Results');
    console.log('===============================');
    
    Object.entries(allResults).forEach(([suiteName, results]) => {
      console.log(`\n🔧 ${suiteName}:`);
      results.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`   ${status} ${test.name}`);
        if (test.details) {
          console.log(`      Details: ${JSON.stringify(test.details, null, 2)}`);
        }
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    });

    console.log('\n📊 Tool Execution Results');
    console.log(`${totalPassed}/${totalTests} tests passed`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalPassed === totalTests) {
      console.log('✅ All tool execution tests passed!');
      console.log('   • Tool response format is correct');
      console.log('   • No double-wrapping issues detected');
      console.log('   • Multiple tools work consistently');
      console.log('   • Error handling works properly');
    } else {
      console.log('⚠️ Some tool execution issues detected');
      console.log('   💡 This test suite would catch response format bugs like double-wrapping');
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const executionTest = new ToolExecutionTest();
  
  executionTest.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Tool execution test error:', error);
      process.exit(1);
    });
}

export { ToolExecutionTest };