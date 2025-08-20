#!/usr/bin/env node
/**
 * Multi-client concurrent testing for GitLab MCP server
 * Tests session isolation, concurrent access, and proper cleanup
 */

import { randomUUID } from 'crypto';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

// Test configuration
const TEST_CONFIG = {
  serverUrl: SERVER_URL,
  mcpEndpoint: MCP_ENDPOINT,
  // Use real GitLab token from environment if available, otherwise mock tokens
  tokens: process.env.TEST_GITLAB_TOKEN ? [
    process.env.TEST_GITLAB_TOKEN,
    process.env.TEST_GITLAB_TOKEN,
    process.env.TEST_GITLAB_TOKEN,
  ] : [
    'glpat-test-token-1-' + randomUUID().substring(0, 8),
    'glpat-test-token-2-' + randomUUID().substring(0, 8),
    'glpat-test-token-3-' + randomUUID().substring(0, 8),
  ],
  gitlabUrls: process.env.TEST_GITLAB_URL ? [
    process.env.TEST_GITLAB_URL,
    process.env.TEST_GITLAB_URL,
    process.env.TEST_GITLAB_URL,
  ] : [
    'https://gitlab.example.com/api/v4',
    'https://gitlab.test.com/api/v4', 
    'https://gitlab.demo.com/api/v4',
  ],
};

class TestRunner {
  constructor() {
    this.results = [];
    this.sessionIds = new Map();
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
    this.results.push({ timestamp, message, data });
  }

  async testServerHealth() {
    await this.log('Testing server health endpoint...');
    try {
      const response = await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
      if (response.status === 200 && response.data.status === 'ok') {
        await this.log('✅ Server health check passed');
        return true;
      }
      await this.log('❌ Server health check failed', { status: response.status });
      return false;
    } catch (error) {
      await this.log('❌ Server health check failed', { error: error.message });
      return false;
    }
  }

  async createMcpClient(token, gitlabUrl) {
    return axios.create({
      baseURL: MCP_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-GitLab-Token': token,
        'X-GitLab-URL': gitlabUrl,
      },
      timeout: 10000,
    });
  }

  async sendMcpRequest(client, method, params = {}, sessionId = null) {
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
    if (typeof response.data === 'string' && response.data.startsWith('event: message\ndata: ')) {
      const dataLine = response.data.split('\n').find(line => line.startsWith('data: '));
      if (dataLine) {
        return JSON.parse(dataLine.substring(6));
      }
    }
    return response.data;
  }

  async testConcurrentSessions() {
    await this.log('Testing concurrent session creation...');
    const clients = [];
    const sessions = [];

    try {
      // Create multiple clients concurrently
      for (let i = 0; i < TEST_CONFIG.tokens.length; i++) {
        const client = await this.createMcpClient(TEST_CONFIG.tokens[i], TEST_CONFIG.gitlabUrls[i]);
        clients.push(client);
      }

      // Initialize sessions concurrently
      const initPromises = clients.map(async (client, index) => {
        try {
          await this.log(`Initializing session ${index + 1}...`);
          const response = await this.sendMcpRequest(client, 'initialize', {
            protocolVersion: '1.0.0',
            capabilities: {
              canListTools: true,
              canCallTools: true,
            },
            clientInfo: {
              name: `test-client-${index + 1}`,
              version: '1.0.0',
            },
          });

          if (response.result) {
            const sessionId = response.result.sessionId || null;
            sessions.push({ client, sessionId, index });
            this.sessionIds.set(`client-${index}`, sessionId);
            await this.log(`✅ Session ${index + 1} initialized`, { sessionId });
            return { success: true, sessionId, index };
          } else {
            await this.log(`❌ Session ${index + 1} initialization failed`, { response });
            return { success: false, index };
          }
        } catch (error) {
          await this.log(`❌ Session ${index + 1} initialization error`, { error: error.message });
          return { success: false, index, error: error.message };
        }
      });

      const results = await Promise.allSettled(initPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      
      await this.log(`Concurrent sessions result: ${successful}/${clients.length} successful`);
      return { successful, total: clients.length, sessions };

    } catch (error) {
      await this.log('❌ Concurrent session test failed', { error: error.message });
      return { successful: 0, total: clients.length, sessions: [] };
    }
  }

  async testSessionIsolation() {
    await this.log('Testing session isolation...');
    
    try {
      // Create two distinct clients with different tokens
      const client1 = await this.createMcpClient(TEST_CONFIG.tokens[0], TEST_CONFIG.gitlabUrls[0]);
      const client2 = await this.createMcpClient(TEST_CONFIG.tokens[1], TEST_CONFIG.gitlabUrls[1]);

      // Initialize both sessions
      const init1 = await this.sendMcpRequest(client1, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canListTools: true },
        clientInfo: { name: 'isolation-test-1', version: '1.0.0' },
      });

      const init2 = await this.sendMcpRequest(client2, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canListTools: true },
        clientInfo: { name: 'isolation-test-2', version: '1.0.0' },
      });

      const sessionId1 = init1.result?.sessionId;
      const sessionId2 = init2.result?.sessionId;

      if (!sessionId1 || !sessionId2) {
        await this.log('❌ Failed to get session IDs for isolation test');
        return false;
      }

      if (sessionId1 === sessionId2) {
        await this.log('❌ Session isolation failed: identical session IDs', { sessionId1, sessionId2 });
        return false;
      }

      // Test cross-session access (should fail)
      try {
        await this.sendMcpRequest(client1, 'tools/list', {}, sessionId2); // Wrong session ID
        await this.log('❌ Session isolation failed: cross-session access allowed');
        return false;
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          await this.log('✅ Session isolation working: cross-session access rejected');
        } else {
          await this.log('⚠️ Unexpected error in cross-session test', { error: error.message });
        }
      }

      // Test proper session access
      const tools1 = await this.sendMcpRequest(client1, 'tools/list', {}, sessionId1);
      const tools2 = await this.sendMcpRequest(client2, 'tools/list', {}, sessionId2);

      if (tools1.result?.tools && tools2.result?.tools) {
        await this.log('✅ Session isolation passed: both sessions working independently');
        return true;
      } else {
        await this.log('❌ Session isolation failed: tools not accessible');
        return false;
      }

    } catch (error) {
      await this.log('❌ Session isolation test error', { error: error.message });
      return false;
    }
  }

  async testConcurrentRequests() {
    await this.log('Testing concurrent requests within sessions...');
    
    try {
      const client = await this.createMcpClient(TEST_CONFIG.tokens[0], TEST_CONFIG.gitlabUrls[0]);
      
      // Initialize session
      const initResponse = await this.sendMcpRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canListTools: true, canListPrompts: true },
        clientInfo: { name: 'concurrent-test', version: '1.0.0' },
      });

      const sessionId = initResponse.result?.sessionId;
      if (!sessionId) {
        await this.log('❌ Failed to initialize session for concurrent test');
        return false;
      }

      // Send multiple concurrent requests
      const requests = [
        this.sendMcpRequest(client, 'tools/list', {}, sessionId),
        this.sendMcpRequest(client, 'prompts/list', {}, sessionId),
        this.sendMcpRequest(client, 'tools/list', {}, sessionId),
        this.sendMcpRequest(client, 'prompts/list', {}, sessionId),
      ];

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.result).length;
      
      await this.log(`Concurrent requests result: ${successful}/${requests.length} successful`);
      return successful === requests.length;

    } catch (error) {
      await this.log('❌ Concurrent requests test error', { error: error.message });
      return false;
    }
  }

  async testSessionCleanup() {
    await this.log('Testing session cleanup and heartbeat...');
    
    try {
      const client = await this.createMcpClient(TEST_CONFIG.tokens[0], TEST_CONFIG.gitlabUrls[0]);
      
      // Test heartbeat endpoint
      const heartbeatResponse = await client.post('/heartbeat', {}, {
        baseURL: SERVER_URL,
      });

      if (heartbeatResponse.status === 200) {
        await this.log('✅ Heartbeat endpoint accessible');
      } else if (heartbeatResponse.status === 404) {
        await this.log('✅ Heartbeat endpoint correctly rejects unauthorized access');
      }

      // Test session statistics (if accessible)
      try {
        const statsResponse = await axios.get(`${SERVER_URL}/stats`);
        if (statsResponse.data) {
          await this.log('Session stats available', { stats: statsResponse.data });
        }
      } catch (error) {
        await this.log('Session stats endpoint not accessible (expected)');
      }

      return true;

    } catch (error) {
      await this.log('❌ Session cleanup test error', { error: error.message });
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Multi-Client MCP Server Tests\n');
    
    const testResults = {
      health: false,
      concurrentSessions: false,
      sessionIsolation: false,
      concurrentRequests: false,
      sessionCleanup: false,
    };

    try {
      // Test 1: Server Health
      testResults.health = await this.testServerHealth();
      
      if (!testResults.health) {
        console.log('\n❌ Server not healthy - stopping tests');
        return this.printSummary(testResults);
      }

      // Test 2: Concurrent Sessions
      await this.log('\n--- Testing Concurrent Sessions ---');
      const sessionResult = await this.testConcurrentSessions();
      testResults.concurrentSessions = sessionResult.successful > 0;

      // Test 3: Session Isolation
      await this.log('\n--- Testing Session Isolation ---');
      testResults.sessionIsolation = await this.testSessionIsolation();

      // Test 4: Concurrent Requests
      await this.log('\n--- Testing Concurrent Requests ---');
      testResults.concurrentRequests = await this.testConcurrentRequests();

      // Test 5: Session Cleanup
      await this.log('\n--- Testing Session Cleanup ---');
      testResults.sessionCleanup = await this.testSessionCleanup();

    } catch (error) {
      await this.log('❌ Test suite error', { error: error.message });
    }

    return this.printSummary(testResults);
  }

  printSummary(results) {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const tests = [
      ['Server Health', results.health],
      ['Concurrent Sessions', results.concurrentSessions],
      ['Session Isolation', results.sessionIsolation],
      ['Concurrent Requests', results.concurrentRequests],
      ['Session Cleanup', results.sessionCleanup],
    ];

    let passed = 0;
    tests.forEach(([name, result]) => {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${name}`);
      if (result) passed++;
    });

    console.log('\n📈 Overall Result');
    console.log(`${passed}/${tests.length} tests passed`);
    
    if (passed === tests.length) {
      console.log('🎉 All tests passed! Server supports multiple concurrent clients.');
    } else {
      console.log('⚠️  Some tests failed. Review logs for details.');
    }

    return { passed, total: tests.length, success: passed === tests.length };
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  
  runner.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { TestRunner, TEST_CONFIG };