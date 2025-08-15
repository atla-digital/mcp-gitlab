#!/usr/bin/env node
/**
 * Session stress testing for GitLab MCP server
 * Tests high-load scenarios, session limits, and memory leaks
 */

import { randomUUID } from 'crypto';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

class SessionStressTest {
  constructor(options = {}) {
    this.options = {
      maxConcurrentSessions: options.maxConcurrentSessions || 50,
      requestsPerSession: options.requestsPerSession || 10,
      testDurationMs: options.testDurationMs || 30000, // 30 seconds
      sessionTimeoutMs: options.sessionTimeoutMs || 5000,
      ...options,
    };
    this.sessions = [];
    this.metrics = {
      sessionsCreated: 0,
      sessionsSuccessful: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      errors: [],
      startTime: null,
      endTime: null,
    };
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
  }

  generateTestToken() {
    return 'glpat-stress-' + randomUUID().substring(0, 12);
  }

  generateTestGitLabUrl() {
    const domains = ['gitlab.com', 'gitlab.example.com', 'gitlab.test.com', 'code.company.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `https://${domain}/api/v4`;
  }

  async createSession(sessionIndex) {
    const token = this.generateTestToken();
    const gitlabUrl = this.generateTestGitLabUrl();
    
    try {
      const client = axios.create({
        baseURL: MCP_ENDPOINT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'X-GitLab-Token': token,
          'X-GitLab-URL': gitlabUrl,
        },
        timeout: this.options.sessionTimeoutMs,
      });

      // Initialize session
      const response = await client.post('', {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          capabilities: {
            canListTools: true,
            canCallTools: true,
            canListPrompts: true,
          },
          clientInfo: {
            name: `stress-test-${sessionIndex}`,
            version: '1.0.0',
          },
        },
      });

      let sessionId = null;
      // Extract session ID from response
      if (response.data && typeof response.data === 'string') {
        const dataMatch = response.data.match(/data: ({.*})/);
        if (dataMatch) {
          const jsonData = JSON.parse(dataMatch[1]);
          sessionId = jsonData.result?.sessionId;
        }
      } else if (response.data?.result) {
        sessionId = response.data.result.sessionId;
      }

      this.metrics.sessionsCreated++;
      this.metrics.sessionsSuccessful++;

      return {
        client,
        sessionId,
        token: token.substring(0, 12) + '...',
        gitlabUrl,
        sessionIndex,
        created: Date.now(),
      };

    } catch (error) {
      this.metrics.errors.push({
        type: 'session_creation',
        sessionIndex,
        error: error.message,
        timestamp: Date.now(),
      });
      return null;
    }
  }

  async executeSessionRequests(session) {
    const requests = [];
    const requestTypes = ['tools/list', 'prompts/list', 'tools/list', 'prompts/list'];
    
    for (let i = 0; i < this.options.requestsPerSession; i++) {
      const requestType = requestTypes[i % requestTypes.length];
      const requestPromise = this.executeRequest(session, requestType, i);
      requests.push(requestPromise);
    }

    const results = await Promise.allSettled(requests);
    return results;
  }

  async executeRequest(session, method, requestIndex) {
    try {
      const headers = { ...session.client.defaults.headers };
      if (session.sessionId) {
        headers['Mcp-Session-Id'] = session.sessionId;
      }

      const response = await session.client.post('', {
        jsonrpc: '2.0',
        id: randomUUID(),
        method,
        params: {},
      }, { headers });

      this.metrics.requestsSuccessful++;
      return { success: true, method, requestIndex };

    } catch (error) {
      this.metrics.requestsFailed++;
      this.metrics.errors.push({
        type: 'request_execution',
        sessionIndex: session.sessionIndex,
        requestIndex,
        method,
        error: error.message,
        timestamp: Date.now(),
      });
      return { success: false, method, requestIndex, error: error.message };
    }
  }

  async runConcurrentSessionsTest() {
    await this.log(`🔥 Starting stress test with ${this.options.maxConcurrentSessions} concurrent sessions`);
    this.metrics.startTime = Date.now();

    // Phase 1: Create all sessions concurrently
    await this.log('Phase 1: Creating concurrent sessions...');
    const sessionPromises = [];
    
    for (let i = 0; i < this.options.maxConcurrentSessions; i++) {
      sessionPromises.push(this.createSession(i));
    }

    const sessionResults = await Promise.allSettled(sessionPromises);
    const successfulSessions = sessionResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    await this.log(`Phase 1 complete: ${successfulSessions.length}/${this.options.maxConcurrentSessions} sessions created`);

    if (successfulSessions.length === 0) {
      await this.log('❌ No sessions created successfully - aborting stress test');
      return;
    }

    // Phase 2: Execute requests concurrently across all sessions
    await this.log('Phase 2: Executing concurrent requests across all sessions...');
    const requestPromises = successfulSessions.map(session => this.executeSessionRequests(session));
    
    const requestResults = await Promise.allSettled(requestPromises);
    
    this.metrics.endTime = Date.now();
    const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;

    await this.log(`Phase 2 complete: ${this.metrics.requestsSuccessful} successful requests in ${duration}s`);
    
    return {
      sessionsAttempted: this.options.maxConcurrentSessions,
      sessionsSuccessful: successfulSessions.length,
      requestsExecuted: this.metrics.requestsSuccessful + this.metrics.requestsFailed,
      requestsSuccessful: this.metrics.requestsSuccessful,
      duration,
      requestsPerSecond: this.metrics.requestsSuccessful / duration,
    };
  }

  async runMemoryLeakTest() {
    await this.log('🧠 Starting memory leak detection test...');
    
    const initialMemory = process.memoryUsage();
    const testIterations = 5;
    const sessionsPerIteration = 20;

    for (let iteration = 0; iteration < testIterations; iteration++) {
      await this.log(`Memory test iteration ${iteration + 1}/${testIterations}`);
      
      // Create sessions
      const sessions = [];
      for (let i = 0; i < sessionsPerIteration; i++) {
        const session = await this.createSession(i);
        if (session) sessions.push(session);
      }

      // Execute requests
      await Promise.all(sessions.map(s => this.executeSessionRequests(s)));
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const currentMemory = process.memoryUsage();
      const heapGrowth = currentMemory.heapUsed - initialMemory.heapUsed;
      
      await this.log(`Iteration ${iteration + 1} memory usage:`, {
        heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024) + 'MB',
        heapGrowth: Math.round(heapGrowth / 1024 / 1024) + 'MB',
      });

      // Wait between iterations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const finalMemory = process.memoryUsage();
    const totalGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    
    return {
      initialHeap: Math.round(initialMemory.heapUsed / 1024 / 1024),
      finalHeap: Math.round(finalMemory.heapUsed / 1024 / 1024),
      growth: Math.round(totalGrowth / 1024 / 1024),
      iterations: testIterations,
      sessionsPerIteration,
    };
  }

  async testErrorRecovery() {
    await this.log('🔄 Testing error recovery and resilience...');
    
    const tests = [];
    
    // Test 1: Invalid tokens
    tests.push(this.testInvalidTokenHandling());
    
    // Test 2: Malformed requests
    tests.push(this.testMalformedRequests());
    
    // Test 3: Rapid session creation/destruction
    tests.push(this.testRapidSessionCycling());

    const results = await Promise.allSettled(tests);
    return results.map((r, i) => ({
      test: ['invalid_tokens', 'malformed_requests', 'session_cycling'][i],
      success: r.status === 'fulfilled',
      result: r.status === 'fulfilled' ? r.value : r.reason,
    }));
  }

  async testInvalidTokenHandling() {
    const invalidTokens = ['', 'invalid', 'glpat-invalid-token', null, undefined];
    const results = [];
    
    for (const token of invalidTokens) {
      try {
        const client = axios.create({
          baseURL: MCP_ENDPOINT,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'X-GitLab-Token': token || '',
            'X-GitLab-URL': 'https://gitlab.com/api/v4',
          },
          timeout: 5000,
        });

        await client.post('', {
          jsonrpc: '2.0',
          id: randomUUID(),
          method: 'initialize',
          params: {},
        });

        results.push({ token: String(token), handled: false });
      } catch (error) {
        results.push({ 
          token: String(token), 
          handled: true, 
          statusCode: error.response?.status,
          message: error.response?.data?.message || error.message 
        });
      }
    }

    return results;
  }

  async testMalformedRequests() {
    const client = axios.create({
      baseURL: MCP_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-GitLab-Token': this.generateTestToken(),
        'X-GitLab-URL': 'https://gitlab.com/api/v4',
      },
      timeout: 5000,
    });

    const malformedRequests = [
      { invalid: 'json' },
      { jsonrpc: '1.0' }, // Wrong version
      { jsonrpc: '2.0', method: 'invalid_method' },
      { jsonrpc: '2.0', id: 'test' }, // Missing method
      '', // Empty string
      null,
    ];

    const results = [];
    for (const request of malformedRequests) {
      try {
        await client.post('', request);
        results.push({ request: JSON.stringify(request), handled: false });
      } catch (error) {
        results.push({ 
          request: JSON.stringify(request), 
          handled: true, 
          statusCode: error.response?.status 
        });
      }
    }

    return results;
  }

  async testRapidSessionCycling() {
    const cycles = 10;
    const results = [];
    
    for (let i = 0; i < cycles; i++) {
      const startTime = Date.now();
      const session = await this.createSession(i);
      
      if (session) {
        await this.executeRequest(session, 'tools/list', 0);
        // Session cleanup happens automatically on server
      }
      
      const duration = Date.now() - startTime;
      results.push({ cycle: i, duration, success: !!session });
    }

    return results;
  }

  printResults(stressResult, memoryResult, errorResults) {
    console.log('\n📊 Stress Test Results');
    console.log('=======================');
    
    if (stressResult) {
      console.log('\n🔥 Concurrent Sessions Test:');
      console.log(`   Sessions Created: ${stressResult.sessionsSuccessful}/${stressResult.sessionsAttempted}`);
      console.log(`   Requests Executed: ${stressResult.requestsExecuted}`);
      console.log(`   Success Rate: ${((stressResult.requestsSuccessful / stressResult.requestsExecuted) * 100).toFixed(1)}%`);
      console.log(`   Duration: ${stressResult.duration.toFixed(2)}s`);
      console.log(`   Throughput: ${stressResult.requestsPerSecond.toFixed(1)} req/s`);
    }

    if (memoryResult) {
      console.log('\n🧠 Memory Usage Test:');
      console.log(`   Initial Heap: ${memoryResult.initialHeap}MB`);
      console.log(`   Final Heap: ${memoryResult.finalHeap}MB`);
      console.log(`   Growth: ${memoryResult.growth}MB`);
      console.log(`   Growth per session: ${(memoryResult.growth / (memoryResult.iterations * memoryResult.sessionsPerIteration)).toFixed(2)}MB`);
    }

    if (errorResults) {
      console.log('\n🔄 Error Recovery Tests:');
      errorResults.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`   ${status} ${test.test}`);
      });
    }

    console.log('\n📈 Error Summary:');
    console.log(`   Total Errors: ${this.metrics.errors.length}`);
    if (this.metrics.errors.length > 0) {
      const errorTypes = this.metrics.errors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {});
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
  }

  async run() {
    console.log('🧪 Starting Session Stress Test Suite\n');
    
    try {
      // Test server health first
      const healthResponse = await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
      if (healthResponse.status !== 200) {
        throw new Error('Server not healthy');
      }
      await this.log('✅ Server health check passed');

      // Run stress tests
      const stressResult = await this.runConcurrentSessionsTest();
      const memoryResult = await this.runMemoryLeakTest();
      const errorResults = await this.testErrorRecovery();

      this.printResults(stressResult, memoryResult, errorResults);

      // Determine overall success
      const success = stressResult && 
                     stressResult.sessionsSuccessful > 0 && 
                     stressResult.requestsSuccessful > 0 &&
                     memoryResult.growth < 100; // Less than 100MB growth acceptable

      console.log(success ? '\n🎉 Stress tests passed!' : '\n⚠️ Some stress tests failed');
      return success;

    } catch (error) {
      await this.log('❌ Stress test suite error', { error: error.message });
      console.log('\n❌ Stress test suite failed');
      return false;
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const stressTest = new SessionStressTest({
    maxConcurrentSessions: parseInt(process.argv[2]) || 20,
    requestsPerSession: parseInt(process.argv[3]) || 5,
  });
  
  stressTest.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Stress test runner error:', error);
      process.exit(1);
    });
}

export { SessionStressTest };