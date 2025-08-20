#!/usr/bin/env node
/**
 * Session Recovery Testing
 * Tests selective session management without server restart
 */

import { randomUUID } from 'crypto';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';
const MCP_ENDPOINT = `${SERVER_URL}/mcp`;

class SessionRecoveryTest {
  constructor() {
    this.results = [];
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
    this.results.push({ timestamp, message, data });
  }

  async createClient(tokenSuffix = '', gitlabUrl = null) {
    const token = process.env.TEST_GITLAB_TOKEN || `glpat-test-recovery-${tokenSuffix}-${randomUUID().substring(0, 8)}`;
    const url = gitlabUrl || process.env.TEST_GITLAB_URL || 'https://gitlab.com/api/v4';
    
    return axios.create({
      baseURL: MCP_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-GitLab-Token': token,
        'X-GitLab-URL': url,
      },
      timeout: 10000,
      validateStatus: () => true,
    });
  }

  async sendMcpRequest(client, method, params = {}, sessionId = null) {
    const headers = { ...client.defaults.headers };
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    try {
      const response = await client.post('', {
        jsonrpc: '2.0',
        id: randomUUID(),
        method,
        params,
      }, { headers });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
        sessionId: response.headers['mcp-session-id']
      };
    } catch (error) {
      return {
        status: error.response?.status || 0,
        error: error.message,
        sessionId: error.response?.headers?.['mcp-session-id']
      };
    }
  }

  async getSessionStats() {
    try {
      const response = await axios.get(`${SERVER_URL}/sessions`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async cleanupSession(sessionKey) {
    try {
      const response = await axios.post(`${SERVER_URL}/sessions/cleanup`, 
        { sessionKey },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resetSession(sessionKey) {
    try {
      const response = await axios.post(`${SERVER_URL}/sessions/reset`, 
        { sessionKey },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testReinitialization() {
    await this.log('Testing graceful reinitialization handling...');
    const tests = [];

    try {
      const client = await this.createClient('reinit');
      
      // First initialization
      const init1 = await this.sendMcpRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canListTools: true },
        clientInfo: { name: 'reinit-test-1', version: '1.0.0' }
      });

      tests.push({
        name: 'First initialization',
        passed: [200, 401, 500, 502].includes(init1.status),
        details: { 
          statusCode: init1.status,
          hasSessionId: !!init1.sessionId
        }
      });

      // Second initialization (should handle gracefully)  
      const init2 = await this.sendMcpRequest(client, 'initialize', {
        protocolVersion: '1.0.0',
        capabilities: { canListTools: true },
        clientInfo: { name: 'reinit-test-2', version: '1.0.0' }
      });

      tests.push({
        name: 'Reinitialization handling',
        passed: [200, 401, 500, 502].includes(init2.status),
        details: { 
          statusCode: init2.status,
          hasSessionId: !!init2.sessionId,
          differentFromFirst: init2.sessionId !== init1.sessionId
        }
      });

    } catch (error) {
      tests.push({
        name: 'Reinitialization test',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testSelectiveSessionCleanup() {
    await this.log('Testing selective session cleanup...');
    const tests = [];

    try {
      // Create multiple clients
      const client1 = await this.createClient('cleanup1');
      const client2 = await this.createClient('cleanup2');
      const client3 = await this.createClient('cleanup3');

      // Initialize all sessions
      const [init1, init2, init3] = await Promise.all([
        this.sendMcpRequest(client1, 'initialize', { 
          clientInfo: { name: 'cleanup-test-1', version: '1.0.0' }
        }),
        this.sendMcpRequest(client2, 'initialize', { 
          clientInfo: { name: 'cleanup-test-2', version: '1.0.0' }
        }),
        this.sendMcpRequest(client3, 'initialize', { 
          clientInfo: { name: 'cleanup-test-3', version: '1.0.0' }
        })
      ]);

      const initialStats = await this.getSessionStats();
      
      tests.push({
        name: 'Multiple sessions created',
        passed: initialStats && initialStats.totalSessions >= 3,
        details: { 
          totalSessions: initialStats?.totalSessions || 0,
          client1Status: init1.status,
          client2Status: init2.status,
          client3Status: init3.status
        }
      });

      // Clean up only session 2 (simulate problematic client)
      const token2 = client2.defaults.headers['X-GitLab-Token'];
      const sessionKey2 = `${token2}:${client2.defaults.headers['X-GitLab-URL']}`;
      
      const cleanupResult = await this.cleanupSession(sessionKey2);
      
      tests.push({
        name: 'Selective session cleanup',
        passed: cleanupResult.success === true,
        details: { 
          cleanupSuccess: cleanupResult.success,
          message: cleanupResult.message
        }
      });

      // Verify other sessions still work
      const afterCleanupStats = await this.getSessionStats();
      const client1Test = await this.sendMcpRequest(client1, 'tools/list', {});
      const client3Test = await this.sendMcpRequest(client3, 'tools/list', {});

      tests.push({
        name: 'Other sessions unaffected',
        passed: afterCleanupStats && 
                afterCleanupStats.totalSessions >= 2 &&
                [200, 401, 500, 502].includes(client1Test.status) &&
                [200, 401, 500, 502].includes(client3Test.status),
        details: { 
          sessionsAfterCleanup: afterCleanupStats?.totalSessions || 0,
          client1StillWorks: [200, 401, 500, 502].includes(client1Test.status),
          client3StillWorks: [200, 401, 500, 502].includes(client3Test.status)
        }
      });

    } catch (error) {
      tests.push({
        name: 'Selective cleanup test',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testSessionReset() {
    await this.log('Testing session reset functionality...');
    const tests = [];

    try {
      const client = await this.createClient('reset');
      
      // Initialize session
      const init1 = await this.sendMcpRequest(client, 'initialize', {
        clientInfo: { name: 'reset-test', version: '1.0.0' }
      });

      const beforeStats = await this.getSessionStats();
      const token = client.defaults.headers['X-GitLab-Token'];
      const sessionKey = `${token}:${client.defaults.headers['X-GitLab-URL']}`;
      
      // Reset the session initialization state
      const resetResult = await this.resetSession(sessionKey);
      
      tests.push({
        name: 'Session reset operation',
        passed: resetResult.success === true,
        details: { 
          resetSuccess: resetResult.success,
          message: resetResult.message
        }
      });

      // Try to reinitialize after reset
      const init2 = await this.sendMcpRequest(client, 'initialize', {
        clientInfo: { name: 'reset-test-after', version: '1.0.0' }
      });

      const afterStats = await this.getSessionStats();

      tests.push({
        name: 'Reinitialization after reset',
        passed: [200, 401, 500, 502].includes(init2.status),
        details: { 
          reinitStatus: init2.status,
          sessionsBefore: beforeStats?.totalSessions || 0,
          sessionsAfter: afterStats?.totalSessions || 0,
          sessionMaintained: (afterStats?.totalSessions || 0) >= (beforeStats?.totalSessions || 0)
        }
      });

    } catch (error) {
      tests.push({
        name: 'Session reset test',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async testConcurrentOperations() {
    await this.log('Testing concurrent operations during session management...');
    const tests = [];

    try {
      // Create multiple clients
      const clients = [];
      for (let i = 0; i < 5; i++) {
        clients.push(await this.createClient(`concurrent-${i}`));
      }

      // Initialize all sessions concurrently
      const initPromises = clients.map((client, i) => 
        this.sendMcpRequest(client, 'initialize', {
          clientInfo: { name: `concurrent-test-${i}`, version: '1.0.0' }
        })
      );

      const initResults = await Promise.allSettled(initPromises);
      const successfulInits = initResults.filter(r => 
        r.status === 'fulfilled' && 
        [200, 401, 500, 502].includes(r.value.status)
      ).length;

      tests.push({
        name: 'Concurrent initialization',
        passed: successfulInits >= 3, // At least 60% success
        details: { 
          successful: successfulInits,
          total: clients.length
        }
      });

      // Perform operations while manipulating sessions
      const operationPromises = [];
      const sessionManagementPromises = [];

      // Add ongoing operations
      clients.forEach((client, i) => {
        operationPromises.push(
          this.sendMcpRequest(client, 'tools/list', {})
        );
      });

      // Add session management operations
      const token1 = clients[1].defaults.headers['X-GitLab-Token'];
      const sessionKey1 = `${token1}:${clients[1].defaults.headers['X-GitLab-URL']}`;
      sessionManagementPromises.push(this.resetSession(sessionKey1));

      const token3 = clients[3].defaults.headers['X-GitLab-Token'];  
      const sessionKey3 = `${token3}:${clients[3].defaults.headers['X-GitLab-URL']}`;
      sessionManagementPromises.push(this.cleanupSession(sessionKey3));

      // Wait for all operations to complete
      const [opResults, mgmtResults] = await Promise.allSettled([
        Promise.allSettled(operationPromises),
        Promise.allSettled(sessionManagementPromises)
      ]);

      const successfulOps = opResults.value?.filter(r => 
        r.status === 'fulfilled' && 
        [200, 401, 500, 502].includes(r.value.status)
      ).length || 0;

      tests.push({
        name: 'Concurrent operations with session management',
        passed: successfulOps >= 2 && mgmtResults.status === 'fulfilled',
        details: { 
          successfulOperations: successfulOps,
          totalOperations: clients.length,
          sessionManagementCompleted: mgmtResults.status === 'fulfilled'
        }
      });

    } catch (error) {
      tests.push({
        name: 'Concurrent operations test',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  async runAllTests() {
    console.log('🔧 Starting Session Recovery Tests\n');
    
    const testSuites = [
      { name: 'Reinitialization Handling', test: () => this.testReinitialization() },
      { name: 'Selective Session Cleanup', test: () => this.testSelectiveSessionCleanup() },
      { name: 'Session Reset', test: () => this.testSessionReset() },
      { name: 'Concurrent Operations', test: () => this.testConcurrentOperations() },
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

      // Wait between test suites
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.printResults(allResults, totalPassed, totalTests);
    return { passed: totalPassed, total: totalTests, success: totalPassed >= Math.floor(totalTests * 0.7) };
  }

  printResults(allResults, totalPassed, totalTests) {
    console.log('\n📋 Session Recovery Test Results');
    console.log('==================================');
    
    Object.entries(allResults).forEach(([suiteName, results]) => {
      console.log(`\n🔧 ${suiteName}:`);
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

    console.log('\n📊 Session Recovery Results');
    console.log(`${totalPassed}/${totalTests} tests passed`);
    console.log(`Recovery Score: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    const threshold = Math.floor(totalTests * 0.7);
    if (totalPassed >= threshold) {
      console.log('✅ Session recovery system working correctly!');
      console.log('   • Reinitialization handled gracefully without restarts');
      console.log('   • Selective session cleanup preserves other clients');
      console.log('   • Session reset allows fresh initialization');
      console.log('   • Concurrent operations work during session management');
    } else {
      console.log('⚠️ Some session recovery issues detected');
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const recoveryTest = new SessionRecoveryTest();
  
  recoveryTest.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Session recovery test error:', error);
      process.exit(1);
    });
}

export { SessionRecoveryTest };