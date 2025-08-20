# Multi-Client Testing Suite

This directory contains comprehensive tests to verify that the MCP GitLab server supports multiple concurrent clients with proper session isolation and MCP protocol compliance.

## Test Files

### `multi-client.test.js`
Basic multi-client functionality tests:
- ✅ Concurrent session creation
- ✅ Session isolation (different tokens/URLs)
- ✅ Cross-session access prevention
- ✅ Concurrent requests within sessions
- ✅ Session cleanup and heartbeat

### `session-stress.test.js`
High-load and stress testing:
- 🔥 Concurrent session stress (50+ sessions)
- 🧠 Memory leak detection
- 🔄 Error recovery and resilience
- ⚡ Performance metrics and throughput
- 🛡️ Invalid token/malformed request handling

### `mcp-compliance.test.js`
MCP Protocol specification compliance:
- 📋 JSON-RPC 2.0 compliance
- 🔄 Lifecycle management (initialize → initialized)
- 🆔 Session ID format and uniqueness
- 🚀 Streamable HTTP transport compliance
- 🤝 Capabilities negotiation
- 🔒 Security requirements (Origin header, auth)

### `session-recovery.test.js`
Session recovery and selective management tests:
- 🔄 Graceful reinitialization handling (no server restarts needed)
- 🎯 Selective session cleanup (clean one client, preserve others)
- 🔧 Session reset functionality
- 🚀 Concurrent operations during session management

### `mock-server.test.js`
Architecture verification without GitLab dependencies:
- 🏗️ Server architecture validation
- 🔗 HTTP transport layer testing
- ⚡ Performance and resource management
- ✅ Protocol compliance verification

### `run-all-tests.js`
Test orchestrator and runner:
- 🎯 Runs all test suites in sequence
- 📊 Comprehensive reporting and statistics
- 🚀 Server readiness checking
- ⚙️ Configurable test parameters

## Usage

### Prerequisites
Make sure the MCP server is running:
```bash
npm run build && npm start
```
Server should be accessible at `http://localhost:3001`

### Running Tests

#### Run All Tests
```bash
npm run test:all
```

#### Run Individual Test Suites
```bash
# Basic multi-client tests
npm run test:multi-client

# Stress testing
npm run test:stress

# Protocol compliance
npm run test:compliance

# Session recovery testing
npm run test:recovery

# Mock architecture verification
npm run test:mock

# Quick tests (reduced parameters)
npm run test:quick
```

#### Direct Execution
```bash
# Run specific tests directly
node tests/multi-client.test.js
node tests/session-stress.test.js 20 5  # 20 sessions, 5 requests each
node tests/mcp-compliance.test.js
```

#### Test Orchestrator Options
```bash
# Run with custom parameters
node tests/run-all-tests.js --quick
node tests/run-all-tests.js --stress-only
node tests/run-all-tests.js --compliance-only
node tests/run-all-tests.js --server-url http://localhost:3002
```

## Test Results Interpretation

### Success Indicators
- ✅ All sessions created successfully
- ✅ Session IDs are unique and properly formatted
- ✅ Cross-session access properly rejected (400/404 errors)
- ✅ Concurrent requests handled without conflicts
- ✅ Memory growth stays reasonable (<100MB)
- ✅ JSON-RPC 2.0 responses properly formatted
- ✅ MCP lifecycle sequence works correctly

### Common Issues
- ❌ Server not running: Check `http://localhost:3001/health`
- ❌ Session creation failures: Check GitLab token/URL validity
- ❌ Memory leaks: Monitor heap growth across test iterations
- ❌ Protocol violations: Review JSON-RPC and MCP spec compliance

## Architecture Verification

These tests verify the key architectural decisions that enable multi-client support:

### Session Isolation (`src/server/streamable-http-server.ts:42`)
- Each client gets isolated session via `Map<string, SessionData>`
- Session keys: `${gitlabApiToken}:${gitlabApiUrl}`
- Separate axios instances prevent credential mixing

### Concurrent Request Handling (`src/server/streamable-http-server.ts:499`)
- Request-scoped session context via `this.currentSessionData`
- Context cleared after each request to prevent contamination
- Thread-safe session data access

### MCP Protocol Compliance
- Streamable HTTP transport with proper session management
- JSON-RPC 2.0 message format enforcement  
- Cryptographically secure session IDs using `randomUUID()`
- Session header requirements (`Mcp-Session-Id`)

## Session Management Solution

The implementation provides a **complete solution to the initialization problem** without requiring server restarts:

### Problem Solved
- **Root Cause**: MCP SDK's `StreamableHTTPServerTransport` maintains global initialization state, but sessions are per-client
- **Previous Issue**: "Server already initialized" errors required full server restart, disrupting all clients
- **Solution**: Per-session initialization tracking with selective recovery

### Implementation Details

#### Per-Session State Tracking (`src/server/streamable-http-server.ts:31-40`)
```typescript
interface SessionData {
  gitlabApiToken: string;
  gitlabApiUrl: string;
  handlerContext: HandlerContext;
  lastUsed: Date;
  sessionId?: string;
  initialized: boolean;           // Track per-session init state
  initializationCount: number;    // Count reinitialization attempts
  clientInfo?: any;              // Store client information
}
```

#### Graceful Reinitialization (`src/server/streamable-http-server.ts:659-707`)
- Detects reinitialization attempts automatically
- Resets **only the problematic session** state, not global state
- Generates new session ID for fresh start
- Preserves other active sessions completely

#### Session Management Endpoints
- **`GET /sessions`** - View all active sessions and their states
- **`POST /sessions/cleanup`** - Remove a specific problematic session
- **`POST /sessions/reset`** - Reset initialization state for a session

#### Benefits
✅ **No server restarts needed** - problematic clients don't affect others  
✅ **Selective recovery** - fix one client while others keep working  
✅ **Automatic detection** - server handles reinitialization gracefully  
✅ **Concurrent safety** - all operations are thread-safe  
✅ **Production ready** - handles real-world edge cases

### Usage Example
```bash
# If a client gets stuck initializing, reset just that session:
curl -X POST http://localhost:3000/sessions/reset \
  -H "Content-Type: application/json" \
  -d '{"sessionKey": "glpat-abc123...:https://gitlab.com/api/v4"}'

# Or cleanup the entire session:
curl -X POST http://localhost:3000/sessions/cleanup \
  -H "Content-Type: application/json" \
  -d '{"sessionKey": "glpat-abc123...:https://gitlab.com/api/v4"}'
```

## Configuration

Test parameters can be customized by modifying the test classes or using command-line options:

```javascript
// Stress test configuration
const options = {
  maxConcurrentSessions: 50,
  requestsPerSession: 10,
  testDurationMs: 30000,
  sessionTimeoutMs: 5000,
};

// Test tokens (automatically generated)
const testTokens = [
  'glpat-test-token-1-...',
  'glpat-test-token-2-...',
  'glpat-test-token-3-...',
];
```

## CI/CD Integration

Tests are designed to run in CI/CD environments:
- Return proper exit codes (0 = success, 1 = failure)  
- Provide structured JSON output for parsing
- Configurable timeouts and retry logic
- Reduced test parameters for faster CI execution

## Troubleshooting

### Server Connection Issues
1. Verify server is running: `curl http://localhost:3001/health`
2. Check server logs: `docker compose logs -f`
3. Verify port availability: `netstat -tlnp | grep 3001`

### Test Failures
1. Check server initialization errors in logs
2. Verify GitLab API connectivity (tokens may be invalid)
3. Run individual test suites to isolate issues
4. Use `--quick` mode for faster iteration during debugging

### Memory Issues
1. Tests monitor heap growth across iterations
2. Acceptable growth: <100MB for stress tests
3. Force garbage collection with `global.gc()` if available
4. Check for session cleanup issues in server logs