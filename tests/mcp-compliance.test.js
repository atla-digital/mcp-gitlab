#!/usr/bin/env node
/**
 * MCP Protocol Compliance Testing
 * Validates adherence to MCP specification requirements
 */

import { randomUUID } from 'crypto';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

class McpComplianceTest {
  constructor() {
    this.results = [];
    this.testToken = 'glpat-compliance-test-' + randomUUID().substring(0, 8);
    this.testGitlabUrl = 'https://gitlab.com/api/v4';
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
    this.results.push({ timestamp, message, data });
  }

  async createClient(token = this.testToken, gitlabUrl = this.testGitlabUrl, extraHeaders = {}) {
    return axios.create({
      baseURL: MCP_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-GitLab-Token': token,
        'X-GitLab-URL': gitlabUrl,
        ...extraHeaders,
      },
      timeout: 10000,
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

    // Extract JSON from SSE format
    if (typeof response.data === 'string' && response.data.includes('data: ')) {
      const dataLine = response.data.split('\n').find(line => line.startsWith('data: '));
      if (dataLine) {
        return JSON.parse(dataLine.substring(6));
      }
    }
    return response.data;
  }

  async testJsonRpcCompliance() {
    await this.log('Testing JSON-RPC 2.0 compliance...');
    const client = await this.createClient();
    const tests = [];

    // Test 1: Valid request format
    try {
      const response = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: { name: 'compliance-test', version: '1.0.0' },
      });
      
      tests.push({
        name: 'Valid JSON-RPC request',
        passed: response.jsonrpc === '2.0' && response.hasOwnProperty('id'),
        details: { hasJsonrpc: !!response.jsonrpc, hasId: response.hasOwnProperty('id') }
      });
    } catch (error) {
      tests.push({
        name: 'Valid JSON-RPC request',
        passed: false,
        error: error.message
      });
    }

    // Test 2: Invalid method handling
    try {
      await this.sendRequest(client, 'invalid_method_name', {});
      tests.push({
        name: 'Invalid method rejection',
        passed: false,
        details: 'Should have thrown error'
      });
    } catch (error) {
      tests.push({
        name: 'Invalid method rejection',
        passed: error.response?.status === 400 || error.message.includes('Method not found'),
        details: { statusCode: error.response?.status, message: error.message }
      });
    }

    // Test 3: Missing required fields
    try {
      await client.post('', {
        jsonrpc: '2.0',
        // Missing method and id
        params: {}
      });
      tests.push({
        name: 'Missing required fields rejection',
        passed: false,
        details: 'Should have thrown error'
      });
    } catch (error) {
      tests.push({
        name: 'Missing required fields rejection',
        passed: true,
        details: { statusCode: error.response?.status }
      });
    }

    return tests;
  }

  async testLifecycleCompliance() {
    await this.log('Testing MCP lifecycle compliance...');
    const client = await this.createClient();
    const tests = [];

    // Test 1: Initialize → Initialized sequence
    try {
      const initResponse = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {
          canListTools: true,
          canCallTools: true,
          canListPrompts: true,
        },
        clientInfo: {
          name: 'lifecycle-test',
          version: '1.0.0',
        },
      });

      const sessionId = initResponse.result?.sessionId;
      
      // Send initialized notification
      await client.post('', {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      }, {
        headers: sessionId ? { ...client.defaults.headers, 'Mcp-Session-Id': sessionId } : client.defaults.headers
      });

      tests.push({
        name: 'Initialize → Initialized sequence',
        passed: !!initResponse.result && initResponse.result.protocolVersion,
        details: { 
          hasResult: !!initResponse.result,
          hasProtocolVersion: !!initResponse.result?.protocolVersion,
          sessionId: !!sessionId
        }
      });

      // Test 2: Tools available after initialization
      if (sessionId) {
        const toolsResponse = await this.sendRequest(client, 'tools/list', {}, sessionId);
        tests.push({
          name: 'Tools list after initialization',
          passed: !!toolsResponse.result?.tools && Array.isArray(toolsResponse.result.tools),
          details: { toolCount: toolsResponse.result?.tools?.length || 0 }
        });
      }

    } catch (error) {
      tests.push({
        name: 'Initialize → Initialized sequence',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testSessionManagement() {
    await this.log('Testing session management compliance...');
    const tests = [];

    // Test 1: Session ID format and uniqueness
    try {
      const client1 = await this.createClient(this.testToken + '1');
      const client2 = await this.createClient(this.testToken + '2');

      const init1 = await this.sendRequest(client1, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: { name: 'session-test-1', version: '1.0.0' },
      });

      const init2 = await this.sendRequest(client2, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: { name: 'session-test-2', version: '1.0.0' },
      });

      const sessionId1 = init1.result?.sessionId;
      const sessionId2 = init2.result?.sessionId;

      // Check session ID format (visible ASCII 0x21-0x7E)
      const isValidFormat = (id) => {
        if (!id || typeof id !== 'string') return false;
        return /^[\x21-\x7E]+$/.test(id);
      };

      tests.push({
        name: 'Session ID format compliance',
        passed: isValidFormat(sessionId1) && isValidFormat(sessionId2),
        details: {
          sessionId1Valid: isValidFormat(sessionId1),
          sessionId2Valid: isValidFormat(sessionId2),
          sessionId1Length: sessionId1?.length || 0,
          sessionId2Length: sessionId2?.length || 0,
        }
      });

      tests.push({
        name: 'Session ID uniqueness',
        passed: sessionId1 !== sessionId2 && sessionId1 && sessionId2,
        details: {
          session1: sessionId1?.substring(0, 8) + '...',
          session2: sessionId2?.substring(0, 8) + '...',
          areUnique: sessionId1 !== sessionId2
        }
      });

    } catch (error) {
      tests.push({
        name: 'Session management',
        passed: false,
        error: error.message
      });
    }

    // Test 2: Session header requirement
    try {
      const client = await this.createClient();
      const initResponse = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: { name: 'header-test', version: '1.0.0' },
      });

      const sessionId = initResponse.result?.sessionId;
      
      if (sessionId) {
        // Test request with session ID
        const withSessionResponse = await this.sendRequest(client, 'tools/list', {}, sessionId);
        
        // Test request without session ID (should fail)
        let withoutSessionFailed = false;
        try {
          await this.sendRequest(client, 'tools/list', {}, null);
        } catch (error) {
          withoutSessionFailed = error.response?.status === 400 || error.response?.status === 404;
        }

        tests.push({
          name: 'Session header requirement',
          passed: !!withSessionResponse.result && withoutSessionFailed,
          details: {
            withSessionSucceeded: !!withSessionResponse.result,
            withoutSessionRejected: withoutSessionFailed
          }
        });
      }

    } catch (error) {
      tests.push({
        name: 'Session header requirement',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testTransportCompliance() {
    await this.log('Testing Streamable HTTP transport compliance...');
    const tests = [];

    // Test 1: HTTP methods support
    const methodTests = [
      { method: 'POST', expected: true },
      { method: 'GET', expected: false }, // GET should only be for SSE
      { method: 'PUT', expected: false },
      { method: 'DELETE', expected: false }, // DELETE for session cleanup
    ];

    for (const { method, expected } of methodTests) {
      try {
        const response = await axios({
          method,
          url: MCP_ENDPOINT,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'X-GitLab-Token': this.testToken,
            'X-GitLab-URL': this.testGitlabUrl,
          },
          data: method === 'POST' ? {
            jsonrpc: '2.0',
            id: randomUUID(),
            method: 'initialize',
            params: {
              protocolVersion: '1.0.0',
              capabilities: {},
              clientInfo: { name: 'method-test', version: '1.0.0' },
            }
          } : undefined,
          timeout: 5000,
        });

        tests.push({
          name: `HTTP ${method} method support`,
          passed: expected,
          details: { statusCode: response.status, expected }
        });

      } catch (error) {
        tests.push({
          name: `HTTP ${method} method support`,
          passed: !expected, // If we expect it to fail and it failed, that's correct
          details: { 
            statusCode: error.response?.status,
            expected,
            actuallyFailed: true
          }
        });
      }
    }

    // Test 2: Content-Type requirements
    const contentTypes = [
      { type: 'application/json', expected: true },
      { type: 'text/plain', expected: false },
      { type: 'application/xml', expected: false },
    ];

    for (const { type, expected } of contentTypes) {
      try {
        const client = axios.create({
          baseURL: MCP_ENDPOINT,
          headers: {
            'Content-Type': type,
            'Accept': 'application/json, text/event-stream',
            'X-GitLab-Token': this.testToken,
            'X-GitLab-URL': this.testGitlabUrl,
          },
          timeout: 5000,
        });

        await client.post('', {
          jsonrpc: '2.0',
          id: randomUUID(),
          method: 'initialize',
          params: {},
        });

        tests.push({
          name: `Content-Type ${type} support`,
          passed: expected,
          details: { contentType: type, expected }
        });

      } catch (error) {
        tests.push({
          name: `Content-Type ${type} support`,
          passed: !expected,
          details: { 
            contentType: type,
            expected,
            statusCode: error.response?.status
          }
        });
      }
    }

    return tests;
  }

  async testCapabilitiesCompliance() {
    await this.log('Testing capabilities negotiation compliance...');
    const client = await this.createClient();
    const tests = [];

    try {
      const initResponse = await this.sendRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {
          canListTools: true,
          canCallTools: true,
          canListPrompts: true,
          canListResources: true,
        },
        clientInfo: {
          name: 'capabilities-test',
          version: '1.0.0',
        },
      });

      const serverCapabilities = initResponse.result?.capabilities;
      const sessionId = initResponse.result?.sessionId;

      // Test 1: Server declares capabilities
      tests.push({
        name: 'Server capabilities declaration',
        passed: !!serverCapabilities && typeof serverCapabilities === 'object',
        details: { 
          hasCapabilities: !!serverCapabilities,
          capabilities: serverCapabilities 
        }
      });

      if (sessionId) {
        // Test 2: Tools capability
        if (serverCapabilities?.tools) {
          try {
            const toolsResponse = await this.sendRequest(client, 'tools/list', {}, sessionId);
            tests.push({
              name: 'Tools capability functional',
              passed: !!toolsResponse.result?.tools,
              details: { toolCount: toolsResponse.result?.tools?.length }
            });
          } catch (error) {
            tests.push({
              name: 'Tools capability functional',
              passed: false,
              error: error.message
            });
          }
        }

        // Test 3: Prompts capability
        if (serverCapabilities?.prompts) {
          try {
            const promptsResponse = await this.sendRequest(client, 'prompts/list', {}, sessionId);
            tests.push({
              name: 'Prompts capability functional',
              passed: !!promptsResponse.result?.prompts,
              details: { promptCount: promptsResponse.result?.prompts?.length }
            });
          } catch (error) {
            tests.push({
              name: 'Prompts capability functional',
              passed: false,
              error: error.message
            });
          }
        }

        // Test 4: Resources capability
        if (serverCapabilities?.resources) {
          try {
            const resourcesResponse = await this.sendRequest(client, 'resources/list', {}, sessionId);
            tests.push({
              name: 'Resources capability functional',
              passed: !!resourcesResponse.result,
              details: { hasResources: !!resourcesResponse.result?.resources }
            });
          } catch (error) {
            tests.push({
              name: 'Resources capability functional',
              passed: false,
              error: error.message
            });
          }
        }
      }

    } catch (error) {
      tests.push({
        name: 'Capabilities negotiation',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testSecurityCompliance() {
    await this.log('Testing security compliance...');
    const tests = [];

    // Test 1: Origin header validation (DNS rebinding protection)
    try {
      const maliciousClient = await this.createClient(this.testToken, this.testGitlabUrl, {
        'Origin': 'http://malicious-site.com'
      });
      
      await this.sendRequest(maliciousClient, 'initialize', {});
      tests.push({
        name: 'Origin header validation',
        passed: false,
        details: 'Should reject malicious origin'
      });
    } catch (error) {
      tests.push({
        name: 'Origin header validation',
        passed: error.response?.status === 403 || error.response?.status === 400,
        details: { statusCode: error.response?.status }
      });
    }

    // Test 2: Authentication header requirement
    try {
      const noAuthClient = axios.create({
        baseURL: MCP_ENDPOINT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          // Missing X-GitLab-Token header
        },
        timeout: 5000,
      });
      
      await noAuthClient.post('', {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'initialize',
        params: {},
      });

      tests.push({
        name: 'Authentication requirement',
        passed: false,
        details: 'Should require authentication'
      });
    } catch (error) {
      tests.push({
        name: 'Authentication requirement',
        passed: error.response?.status === 401 || error.response?.status === 400,
        details: { statusCode: error.response?.status }
      });
    }

    return tests;
  }

  async runAllTests() {
    console.log('🔍 Starting MCP Compliance Test Suite\n');
    
    const testSuites = [
      { name: 'JSON-RPC 2.0 Compliance', test: () => this.testJsonRpcCompliance() },
      { name: 'Lifecycle Compliance', test: () => this.testLifecycleCompliance() },
      { name: 'Session Management', test: () => this.testSessionManagement() },
      { name: 'Transport Compliance', test: () => this.testTransportCompliance() },
      { name: 'Capabilities Compliance', test: () => this.testCapabilitiesCompliance() },
      { name: 'Security Compliance', test: () => this.testSecurityCompliance() },
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

    this.printComplianceResults(allResults, totalPassed, totalTests);
    return { passed: totalPassed, total: totalTests, success: totalPassed === totalTests };
  }

  printComplianceResults(allResults, totalPassed, totalTests) {
    console.log('\n📋 MCP Compliance Test Results');
    console.log('===============================');
    
    Object.entries(allResults).forEach(([suiteName, results]) => {
      console.log(`\n📝 ${suiteName}:`);
      results.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`   ${status} ${test.name}`);
        if (test.details) {
          console.log(`      Details: ${JSON.stringify(test.details)}`);
        }
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    });

    console.log('\n📊 Overall Compliance');
    console.log(`${totalPassed}/${totalTests} tests passed`);
    console.log(`Compliance Score: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 Full MCP compliance achieved!');
    } else {
      console.log('⚠️ Some compliance issues detected - review failed tests');
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const complianceTest = new McpComplianceTest();
  
  complianceTest.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Compliance test runner error:', error);
      process.exit(1);
    });
}

export { McpComplianceTest };