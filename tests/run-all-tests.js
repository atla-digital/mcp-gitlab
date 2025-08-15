#!/usr/bin/env node
/**
 * Test runner for all multi-client and compliance tests
 * Orchestrates the complete test suite
 */

import { TestRunner } from './multi-client.test.js';
import { SessionStressTest } from './session-stress.test.js';
import { McpComplianceTest } from './mcp-compliance.test.js';
import { ToolExecutionTest } from './tool-execution.test.js';
import axios from 'axios';

class TestOrchestrator {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.results = {};
  }

  async log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data.error ? `ERROR: ${data.error}` : '');
  }

  async checkServerHealth() {
    try {
      const response = await axios.get(`${this.serverUrl}/health`, { timeout: 5000 });
      return response.status === 200 && response.data.status === 'ok';
    } catch (error) {
      await this.log('Server health check failed', { error: error.message });
      return false;
    }
  }

  async waitForServer(maxRetries = 30, retryDelay = 1000) {
    await this.log('Waiting for server to be ready...');
    
    for (let i = 0; i < maxRetries; i++) {
      const isHealthy = await this.checkServerHealth();
      if (isHealthy) {
        await this.log('✅ Server is ready');
        return true;
      }
      
      if (i < maxRetries - 1) {
        await this.log(`Waiting for server... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    await this.log('❌ Server failed to become ready');
    return false;
  }

  async runTestSuite(suiteName, TestClass, options = {}) {
    await this.log(`\n🧪 Starting ${suiteName}...`);
    console.log('='.repeat(50));
    
    try {
      const testInstance = new TestClass(options);
      let result;
      
      if (typeof testInstance.runAllTests === 'function') {
        result = await testInstance.runAllTests();
      } else if (typeof testInstance.run === 'function') {
        result = await testInstance.run();
      } else {
        throw new Error(`Test class ${TestClass.name} has no runAllTests() or run() method`);
      }
      
      this.results[suiteName] = {
        passed: result.passed || (result.success ? result.total : 0),
        total: result.total || 1,
        success: result.success,
        details: result,
      };
      
      await this.log(`${suiteName} completed: ${result.success ? 'PASSED' : 'FAILED'}`);
      return result.success;
      
    } catch (error) {
      await this.log(`${suiteName} failed with error`, { error: error.message });
      this.results[suiteName] = {
        passed: 0,
        total: 1,
        success: false,
        error: error.message,
      };
      return false;
    }
  }

  printFinalResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const suites = [
      { name: 'Multi-Client Tests', key: 'Multi-Client Tests' },
      { name: 'MCP Compliance Tests', key: 'MCP Compliance Tests' },
      { name: 'Tool Execution Tests', key: 'Tool Execution Tests' },
      { name: 'Session Stress Tests', key: 'Session Stress Tests' },
    ];
    
    let totalPassed = 0;
    let totalTests = 0;
    let suitesSuccessful = 0;
    
    suites.forEach(({ name, key }) => {
      const result = this.results[key];
      if (result) {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        const score = result.total > 0 ? `${result.passed}/${result.total}` : 'N/A';
        console.log(`${status} ${name}: ${score} tests`);
        
        totalPassed += result.passed;
        totalTests += result.total;
        if (result.success) suitesSuccessful++;
        
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      } else {
        console.log(`❌ FAIL ${name}: Not run`);
      }
    });
    
    console.log('\n📊 OVERALL STATISTICS');
    console.log('─'.repeat(30));
    console.log(`Test Suites: ${suitesSuccessful}/${suites.length} passed`);
    console.log(`Individual Tests: ${totalPassed}/${totalTests} passed`);
    console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    
    const overallSuccess = suitesSuccessful === suites.length;
    console.log(`\n${overallSuccess ? '🎉' : '⚠️'} Overall Result: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n✨ The MCP server fully supports multiple concurrent clients!');
      console.log('   • Session isolation works correctly');
      console.log('   • Concurrent requests are handled properly');
      console.log('   • MCP protocol compliance is maintained');
      console.log('   • Server can handle stress conditions');
    } else {
      console.log('\n🔧 Issues detected - check individual test results above');
    }
    
    return overallSuccess;
  }

  async run() {
    console.log('🚀 MCP Multi-Client Test Orchestrator');
    console.log('=====================================\n');
    
    // Check if server is ready
    const serverReady = await this.waitForServer();
    if (!serverReady) {
      console.log('\n❌ Server not available - cannot run tests');
      console.log('Make sure the MCP server is running on http://localhost:3001');
      console.log('Run: npm run build && npm start');
      return false;
    }
    
    const testConfigurations = [
      {
        name: 'Multi-Client Tests',
        class: TestRunner,
        options: {},
      },
      {
        name: 'MCP Compliance Tests',
        class: McpComplianceTest,
        options: {},
      },
      {
        name: 'Tool Execution Tests',
        class: ToolExecutionTest,
        options: {},
      },
      {
        name: 'Session Stress Tests',
        class: SessionStressTest,
        options: {
          maxConcurrentSessions: 10, // Reduced for CI/local testing
          requestsPerSession: 5,
          testDurationMs: 15000, // 15 seconds
        },
      },
    ];
    
    // Run all test suites
    for (const config of testConfigurations) {
      const success = await this.runTestSuite(config.name, config.class, config.options);
      
      // Add a small delay between test suites
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Print final summary
    const overallSuccess = this.printFinalResults();
    
    return overallSuccess;
  }
}

// Help text
function printHelp() {
  console.log(`
MCP Multi-Client Test Suite
===========================

Usage: node run-all-tests.js [options]

Options:
  --help, -h          Show this help message
  --quick             Run with reduced test parameters for faster execution
  --stress-only       Run only stress tests
  --compliance-only   Run only compliance tests
  --multi-only        Run only multi-client tests
  --server-url URL    Override server URL (default: http://localhost:3001)

Examples:
  node run-all-tests.js                    # Run all tests with default settings
  node run-all-tests.js --quick            # Run all tests with reduced parameters
  node run-all-tests.js --compliance-only  # Run only MCP compliance tests
  node run-all-tests.js --stress-only      # Run only stress tests

Make sure your MCP server is running before executing tests:
  npm run build && npm start
`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    runAll: true,
    runStress: true,
    runCompliance: true,
    runMulti: true,
    serverUrl: 'http://localhost:3001',
    quick: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      case '--quick':
        options.quick = true;
        break;
      case '--stress-only':
        options.runAll = false;
        options.runCompliance = false;
        options.runMulti = false;
        break;
      case '--compliance-only':
        options.runAll = false;
        options.runStress = false;
        options.runMulti = false;
        break;
      case '--multi-only':
        options.runAll = false;
        options.runStress = false;
        options.runCompliance = false;
        break;
      case '--server-url':
        if (i + 1 < args.length) {
          options.serverUrl = args[++i];
        } else {
          console.error('Error: --server-url requires a URL argument');
          process.exit(1);
        }
        break;
      default:
        console.error(`Error: Unknown option ${args[i]}`);
        console.error('Use --help for usage information');
        process.exit(1);
    }
  }
  
  return options;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  const orchestrator = new TestOrchestrator();
  
  // Apply options
  orchestrator.serverUrl = options.serverUrl;
  
  orchestrator.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test orchestrator error:', error);
      process.exit(1);
    });
}

export { TestOrchestrator };