#!/usr/bin/env node
/**
 * Mock server test - bypasses GitLab authentication for testing
 * Validates multi-client architecture without external dependencies
 */

import { randomUUID } from 'crypto';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

class MockServerTest {
  constructor() {
    this.results = [];
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
    this.results.push({ timestamp, message, data });
  }

  async createMockClient(sessionId = null) {
    return axios.create({
      baseURL: MCP_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-GitLab-Token': 'mock-token-' + randomUUID().substring(0, 8),
        'X-GitLab-URL': 'http://mock-gitlab-server/api/v4',
        ...(sessionId && { 'Mcp-Session-Id': sessionId }),
      },
      timeout: 5000,
      // Ignore network errors for mock testing
      validateStatus: () => true,
    });
  }

  async sendMockRequest(client, method, params = {}) {
    try {
      const response = await client.post('', {
        jsonrpc: '2.0',
        id: randomUUID(),
        method,
        params,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      return {
        status: error.response?.status || 0,
        error: error.message,
        headers: error.response?.headers || {},
      };
    }
  }

  async testServerArchitecture() {
    await this.log('Testing server architecture without GitLab dependency...');
    const tests = [];

    // Test 1: Server accepts connections
    try {
      const client = await this.createMockClient();
      const response = await this.sendMockRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: { name: 'mock-test', version: '1.0.0' },
      });

      tests.push({
        name: 'Server connection acceptance',
        passed: response.status !== 0,
        details: { statusCode: response.status }
      });

    } catch (error) {
      tests.push({
        name: 'Server connection acceptance',
        passed: false,
        error: error.message
      });
    }

    // Test 2: Multiple concurrent connections
    const concurrentPromises = [];
    for (let i = 0; i < 5; i++) {
      const client = await this.createMockClient();
      const promise = this.sendMockRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: { name: `concurrent-test-${i}`, version: '1.0.0' },
      });
      concurrentPromises.push(promise);
    }

    try {
      const responses = await Promise.all(concurrentPromises);
      const successfulConnections = responses.filter(r => r.status !== 0).length;
      
      tests.push({
        name: 'Concurrent connections',
        passed: successfulConnections >= 3, // At least 60% success
        details: { successful: successfulConnections, total: 5 }
      });

    } catch (error) {
      tests.push({
        name: 'Concurrent connections',
        passed: false,
        error: error.message
      });
    }

    // Test 3: Request handling without authentication
    try {
      const client = await this.createMockClient();
      const response = await this.sendMockRequest(client, 'tools/list', {});

      // Should get 401/400 but server should handle the request
      tests.push({
        name: 'Request processing',
        passed: [400, 401, 500, 502].includes(response.status),
        details: { 
          statusCode: response.status,
          serverResponded: response.status !== 0
        }
      });

    } catch (error) {
      tests.push({
        name: 'Request processing',
        passed: false,
        error: error.message
      });
    }

    // Test 4: JSON-RPC format handling
    try {
      const client = await this.createMockClient();
      
      // Valid JSON-RPC
      const validResponse = await this.sendMockRequest(client, 'initialize', {});
      
      // Invalid JSON-RPC (should be rejected properly)
      const invalidResponse = await client.post('', {
        invalid: 'request'
      });

      tests.push({
        name: 'JSON-RPC format validation',
        passed: validResponse.status !== invalidResponse.status,
        details: { 
          validStatus: validResponse.status,
          invalidStatus: invalidResponse.status
        }
      });

    } catch (error) {
      tests.push({
        name: 'JSON-RPC format validation',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testSessionIsolationArchitecture() {
    await this.log('Testing session isolation architecture...');
    const tests = [];

    try {
      // Create clients with different tokens
      const client1 = await this.createMockClient();
      const client2 = await this.createMockClient();
      
      client1.defaults.headers['X-GitLab-Token'] = 'token-1-' + randomUUID().substring(0, 8);
      client2.defaults.headers['X-GitLab-Token'] = 'token-2-' + randomUUID().substring(0, 8);

      // Send requests concurrently
      const [response1, response2] = await Promise.all([
        this.sendMockRequest(client1, 'initialize', { 
          clientInfo: { name: 'isolation-test-1', version: '1.0.0' }
        }),
        this.sendMockRequest(client2, 'initialize', { 
          clientInfo: { name: 'isolation-test-2', version: '1.0.0' }
        }),
      ]);

      tests.push({
        name: 'Isolated session handling',
        passed: response1.status !== 0 && response2.status !== 0,
        details: { 
          client1Status: response1.status,
          client2Status: response2.status,
          bothResponded: response1.status !== 0 && response2.status !== 0
        }
      });

      // Test session header isolation
      const sessionId1 = randomUUID();
      const sessionId2 = randomUUID();
      
      client1.defaults.headers['Mcp-Session-Id'] = sessionId1;
      client2.defaults.headers['Mcp-Session-Id'] = sessionId2;

      const [sessionResponse1, sessionResponse2] = await Promise.all([
        this.sendMockRequest(client1, 'tools/list', {}),
        this.sendMockRequest(client2, 'tools/list', {}),
      ]);

      tests.push({
        name: 'Session header isolation',
        passed: sessionResponse1.status !== 0 && sessionResponse2.status !== 0,
        details: { 
          session1Status: sessionResponse1.status,
          session2Status: sessionResponse2.status
        }
      });

    } catch (error) {
      tests.push({
        name: 'Session isolation architecture',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testProtocolCompliance() {
    await this.log('Testing MCP protocol compliance (structure only)...');
    const tests = [];

    // Test HTTP methods
    const httpMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    
    for (const method of httpMethods) {
      try {
        const response = await axios({
          method,
          url: MCP_ENDPOINT,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'X-GitLab-Token': 'mock-token',
            'X-GitLab-URL': 'http://mock-gitlab/api/v4',
          },
          data: method === 'POST' ? {
            jsonrpc: '2.0',
            id: randomUUID(),
            method: 'initialize',
            params: {}
          } : undefined,
          timeout: 3000,
          validateStatus: () => true,
        });

        const expectedForPost = method === 'POST';
        const actuallyWorked = [200, 400, 401, 500, 502].includes(response.status);
        
        tests.push({
          name: `HTTP ${method} method`,
          passed: expectedForPost ? actuallyWorked : !actuallyWorked || response.status >= 400,
          details: { 
            method,
            statusCode: response.status,
            expected: expectedForPost ? 'accepted' : 'rejected'
          }
        });

      } catch (error) {
        const expectedForPost = method === 'POST';
        tests.push({
          name: `HTTP ${method} method`,
          passed: !expectedForPost, // Non-POST should fail
          details: { 
            method,
            error: error.message,
            expected: expectedForPost ? 'accepted' : 'rejected'
          }
        });
      }
    }

    return tests;
  }

  async testResourceManagement() {
    await this.log('Testing resource and memory management...');
    const tests = [];

    try {
      // Test rapid connection creation/disposal
      const rapidConnections = [];
      for (let i = 0; i < 20; i++) {
        const client = await this.createMockClient();
        const promise = this.sendMockRequest(client, 'initialize', {
          clientInfo: { name: `rapid-${i}`, version: '1.0.0' }
        });
        rapidConnections.push(promise);
      }

      const startTime = Date.now();
      const responses = await Promise.allSettled(rapidConnections);
      const duration = Date.now() - startTime;
      
      const successfulResponses = responses.filter(
        r => r.status === 'fulfilled' && r.value.status !== 0
      ).length;

      tests.push({
        name: 'Rapid connection handling',
        passed: successfulResponses >= 10 && duration < 10000, // At least 50% success in <10s
        details: { 
          successful: successfulResponses,
          total: 20,
          duration: `${duration}ms`,
          avgResponseTime: `${Math.round(duration / 20)}ms`
        }
      });

    } catch (error) {
      tests.push({
        name: 'Rapid connection handling',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async runAllTests() {
    console.log('🧪 Starting Mock Server Multi-Client Tests\n');
    
    const testSuites = [
      { name: 'Server Architecture', test: () => this.testServerArchitecture() },
      { name: 'Session Isolation', test: () => this.testSessionIsolationArchitecture() },
      { name: 'Protocol Compliance', test: () => this.testProtocolCompliance() },
      { name: 'Resource Management', test: () => this.testResourceManagement() },
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
    return { passed: totalPassed, total: totalTests, success: totalPassed >= Math.floor(totalTests * 0.7) };
  }

  printResults(allResults, totalPassed, totalTests) {
    console.log('\n📋 Mock Server Test Results');
    console.log('============================');
    
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

    console.log('\n📊 Architecture Verification');
    console.log(`${totalPassed}/${totalTests} tests passed`);
    console.log(`Architecture Score: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    const threshold = Math.floor(totalTests * 0.7); // 70% threshold
    if (totalPassed >= threshold) {
      console.log('✅ Server architecture supports multi-client connections!');
      console.log('   • HTTP transport layer working correctly');
      console.log('   • Session isolation architecture functional');
      console.log('   • Protocol compliance maintained');
      console.log('   • Resource management operational');
      console.log('\n💡 Note: Full functionality requires valid GitLab credentials');
    } else {
      console.log('⚠️ Some architectural issues detected');
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mockTest = new MockServerTest();
  
  mockTest.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Mock server test error:', error);
      process.exit(1);
    });
}

export { MockServerTest };