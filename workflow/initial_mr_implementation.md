# Workflow: Initial MR Implementation

This document outlines the standardized workflow for implementing features from issue analysis through code completion, testing, committing, and preparing merge requests for code review.

**🔧 TECHNOLOGY-AGNOSTIC WORKFLOW**: This workflow does not assume any specific programming language, framework, or build system. All project-specific commands (test, build, lint, etc.) must be documented in the project's CLAUDE.md file. Examples in this document use pseudo-commands like `<PROJECT_TEST_COMMAND>` which should be replaced with actual project commands.

## Prerequisites

- Access to GitLab MCP tools for issue and merge request management
- Local development environment with testing capabilities
- Git repository with appropriate branch permissions
- Understanding of project architecture and security considerations

## Workflow Steps

### 0. 🔧 Initial Setup & Verification

```bash
# BASH: Check current git status and branch
git status
git branch --show-current

# BASH: Verify no uncommitted changes
if [[ $(git status --porcelain) ]]; then
    echo "Warning: Uncommitted changes detected. Commit or stash before proceeding."
    git status --short
    exit 1
fi

# BASH: Get project information
CURRENT_BRANCH=$(git branch --show-current)
REMOTE_URL=$(git remote get-url origin)

# BASH: Verify we're on a feature branch (not main/master)
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "Error: Should be on feature branch for implementation"
    exit 1
fi

# TOOL CALL: Get project ID from remote URL
# gitlab_get_project_id --remote_url $REMOTE_URL
```

**Setup Verification Checklist:**

- [ ] Working directory is clean (no uncommitted changes)
- [ ] Currently on correct feature branch (not main/master)
- [ ] Git remote URL is accessible
- [ ] GitLab project ID successfully retrieved
- [ ] Development environment ready for implementation

### 1. 📋 Task Planning & Setup

```bash
# TOOL CALL: Use TodoWrite tool to create comprehensive task breakdown
# TodoWrite: [
#   {"id": "1", "content": "Analyze issue requirements and acceptance criteria", "status": "pending", "priority": "high"},
#   {"id": "2", "content": "Plan implementation architecture and approach", "status": "pending", "priority": "high"},
#   {"id": "3", "content": "Implement core functionality", "status": "pending", "priority": "high"},
#   {"id": "4", "content": "Add comprehensive tests", "status": "pending", "priority": "high"},
#   {"id": "5", "content": "Run linting and static analysis", "status": "pending", "priority": "high"},
#   {"id": "6", "content": "Commit changes using conventional commits", "status": "pending", "priority": "medium"},
#   {"id": "7", "content": "Push changes to remote repository", "status": "pending", "priority": "medium"},
#   {"id": "8", "content": "Monitor pipeline status and fix issues", "status": "pending", "priority": "high"},
#   {"id": "9", "content": "Create/update merge request", "status": "pending", "priority": "medium"},
#   {"id": "10", "content": "Verify MR is ready for review", "status": "pending", "priority": "medium"}
# ]
```

### 2. 🔍 Issue Analysis & Requirements Gathering

```bash
# TOOL CALL: Get detailed issue information
# gitlab_get_issue --project_id <project_id> --issue_iid <issue_number>

# TOOL CALL: Check for existing merge request
# gitlab_list_merge_requests --project_id <project_id> --source_branch <current_branch>

# TOOL CALL: Analyze codebase for implementation requirements
# Task --description "Analyze implementation requirements" --prompt "
# Analyze the codebase for implementing issue #<issue_number>.
# 
# Focus on:
# 1. Files and components that need modification
# 2. Existing patterns and conventions to follow
# 3. Security and performance considerations
# 4. Testing requirements and existing test structure
# 5. Dependencies and integrations needed
# 
# Return specific implementation guidance including:
# - List of files to create/modify
# - Code patterns to follow
# - Security considerations
# - Testing strategy
# "
```

**Requirements Analysis Checklist:**

- [ ] Understand problem statement and acceptance criteria
- [ ] Identify all affected files and components
- [ ] Note security implications and requirements
- [ ] Assess complexity and scope of changes
- [ ] Map testing strategy and coverage needs
- [ ] Check for dependencies on other components

### 3. 🎯 Implementation Architecture Planning

```bash
# TOOL CALL: Mark planning task as in_progress
# TodoWrite: [{"id": "2", "status": "in_progress", ...}]

# Based on analysis, create detailed implementation plan covering:
# - File structure and new components needed
# - Integration points with existing code
# - Error handling and validation strategies
# - Performance optimization considerations
# - Security measures implementation
```

**Implementation Planning Framework:**

#### Code Organization
- **New Files**: List files to create with purpose
- **Modified Files**: Existing files requiring changes
- **Integration Points**: How new code connects to existing system
- **Dependencies**: External libraries or internal modules needed

#### Implementation Phases
- **Phase 1**: Core functionality implementation
- **Phase 2**: Error handling and validation
- **Phase 3**: Testing and edge cases
- **Phase 4**: Performance optimization and security

#### Quality Standards
- **Code Conventions**: Follow existing patterns
- **Error Handling**: Consistent error management
- **Input Validation**: Comprehensive validation strategy
- **Documentation**: Code comments and API docs

### 4. 🔨 Core Implementation Phase

```bash
# TOOL CALL: Mark implementation task as in_progress
# TodoWrite: [{"id": "3", "status": "in_progress", ...}]

# TOOL CALL: Read existing files to understand context
# Read --file_path <target_file_path>

# TOOL CALL: Create new files if needed
# Write --file_path <new_file_path> --content <initial_content>

# TOOL CALL: Implement changes using Edit or MultiEdit
# MultiEdit --file_path <file_path> --edits [
#   {"old_string": "<existing_code>", "new_string": "<new_code>"},
#   {"old_string": "<existing_code_2>", "new_string": "<new_code_2>"}
# ]

# BASH: Verify syntax/compilation using project-specific commands
# NOTE: Use validation commands documented in CLAUDE.md, not hardcoded assumptions
# Example: eval "<PROJECT_VALIDATION_COMMAND>" where command comes from CLAUDE.md

# TOOL CALL: Validate changes after implementation
# Read --file_path <modified_file> --offset <start_line> --limit <lines_to_check>
```

**Implementation Guidelines:**

- Follow existing code patterns and conventions documented in the project
- Implement comprehensive input validation
- Add proper error handling and logging
- Consider security implications at each step
- Write clean, maintainable, and well-commented code (never mention AI assistance in comments)
- Implement defensive programming practices
- Use project-specific build, test, and quality commands as documented in CLAUDE.md

#### Core Components Implementation

```bash
# Example implementation sequence:
# 1. Data models and types
# 2. Core business logic
# 3. API endpoints and handlers
# 4. Database interactions
# 5. Security and validation layers
# 6. Integration with existing systems
```

### 5. 🧪 Comprehensive Testing Implementation

**CRITICAL**: All tests must pass locally before any commits. Never skip local testing.

```bash
# TOOL CALL: Mark testing task as in_progress
# TodoWrite: [{"id": "4", "status": "in_progress", ...}]

# BASH: Read project-specific commands from CLAUDE.md
echo "Reading project commands from CLAUDE.md..."

if [[ ! -f "CLAUDE.md" ]]; then
    echo "❌ CLAUDE.md file not found - this file should contain project-specific build and test commands"
    echo "Please create CLAUDE.md with the following format:"
    echo "- Test command (e.g., '\`<PROJECT_TEST_COMMAND>\` - Run all tests')"
    echo "- Build command (e.g., '\`<PROJECT_BUILD_COMMAND>\` - Build the project')"
    echo "- Quality command (e.g., '\`<PROJECT_QUALITY_COMMAND>\` - Run static analysis')"
    echo ""
    echo "NOTE: Replace <PROJECT_*_COMMAND> with your project's actual commands."
    echo "Refer to previous workflow instructions for proper CLAUDE.md documentation format."
    exit 1
fi

# BASH: Extract commands from CLAUDE.md
echo "Extracting build and test commands from CLAUDE.md..."

TEST_CMD=$(grep -E "^\s*[-*]\s*\`.*test.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
COVERAGE_CMD=$(grep -E "^\s*[-*]\s*\`.*coverage.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")

echo "Found commands in CLAUDE.md:"
echo "Test command: $TEST_CMD"
echo "Coverage command: $COVERAGE_CMD"

if [[ -z "$TEST_CMD" ]]; then
    echo "❌ No test command found in CLAUDE.md"
    echo "Please add test instructions to CLAUDE.md (e.g., '- \`<PROJECT_TEST_COMMAND>\` - Run all tests')"
    echo "Replace <PROJECT_TEST_COMMAND> with your project's actual test command."
    echo "Refer to previous workflow instructions for proper CLAUDE.md format."
    exit 1
fi

# BASH: Discover existing test files (generic patterns)
echo "Discovering existing test files..."
find . -path "./node_modules" -prune -o -path "./.git" -prune -o \
    \( -name "*test*" -o -name "*spec*" -o -name "test*" \) -type f -print 2>/dev/null | head -10

# TOOL CALL: Implement unit tests following project conventions
# Write --file_path <test_file_path> --content <test_implementation>

# TOOL CALL: Add integration tests if needed
# Write --file_path <integration_test_file> --content <integration_tests>

# BASH: MANDATORY - Run and verify all tests pass locally
echo "Running comprehensive test suite..."
echo "Executing: $TEST_CMD"
if eval "$TEST_CMD"; then
    echo "✅ All tests passed"
else
    echo "❌ CRITICAL: Tests failed - DO NOT PROCEED until all tests pass"
    echo "Fix failing tests before continuing to next step"
    echo "Test command used: $TEST_CMD"
    exit 1
fi

# BASH: MANDATORY - Check test coverage if available
if [[ -n "$COVERAGE_CMD" ]]; then
    echo "Checking test coverage..."
    echo "Executing: $COVERAGE_CMD"
    if eval "$COVERAGE_CMD"; then
        echo "✅ Coverage report generated"
        echo "Review coverage output for adequacy (aim for >70% for new code)"
    else
        echo "⚠️  Coverage check failed or not available"
    fi
else
    echo "⚠️  No coverage command configured in CLAUDE.md - skipping coverage check"
fi

echo "🎉 All tests pass locally - ready to proceed!"
```

**Testing Strategy Components:**

#### Test Categories Required
- **Unit Tests**: Individual function/component testing (using project conventions)
- **Integration Tests**: Inter-component interaction testing
- **Security Tests**: Input validation and vulnerability testing (if applicable to project)
- **Performance Tests**: Load and benchmark testing (if configured in CLAUDE.md)
- **Edge Case Tests**: Boundary conditions and error scenarios

#### Test Coverage Goals
- Project-appropriate coverage thresholds (refer to project standards documented)
- All error paths tested
- Edge cases and boundary conditions covered
- Security validation thoroughly tested (using project-specific approaches)

**NOTE**: All testing approaches must follow project conventions and use commands documented in CLAUDE.md.

### 6. 🔍 Code Quality & Static Analysis

**MANDATORY**: All quality checks must pass locally before committing.

```bash
# TOOL CALL: Mark linting task as in_progress
# TodoWrite: [{"id": "5", "status": "in_progress", ...}]

# BASH: Read quality commands from CLAUDE.md
echo "Reading quality commands from CLAUDE.md..."

LINT_CMD=$(grep -E "^\s*[-*]\s*\`.*check.*\`|^\s*[-*]\s*\`.*lint.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
BUILD_CMD=$(grep -E "^\s*[-*]\s*\`.*build.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")

echo "Found commands in CLAUDE.md:"
echo "Lint command: $LINT_CMD"
echo "Build command: $BUILD_CMD"

# BASH: MANDATORY - Run static analysis if available
if [[ -n "$LINT_CMD" ]]; then
    echo "Running static analysis..."
    echo "Executing: $LINT_CMD"
    if eval "$LINT_CMD"; then
        echo "✅ Static analysis passed"
    else
        echo "❌ CRITICAL: Static analysis failed - DO NOT COMMIT until fixed"
        echo "Command used: $LINT_CMD"
        exit 1
    fi
else
    echo "⚠️  No lint command configured in CLAUDE.md - skipping static analysis"
fi

# BASH: MANDATORY - Verify build/compilation if available
if [[ -n "$BUILD_CMD" ]]; then
    echo "Verifying build..."
    echo "Executing: $BUILD_CMD"
    if eval "$BUILD_CMD"; then
        echo "✅ Build successful"
    else
        echo "❌ CRITICAL: Build failed - DO NOT COMMIT until fixed"
        echo "Command used: $BUILD_CMD"
        exit 1
    fi
else
    echo "⚠️  No build command configured in CLAUDE.md - skipping build verification"
fi

# BASH: Look for additional quality commands in CLAUDE.md
echo "Checking for additional quality commands..."
ADDITIONAL_CMDS=$(grep -E "^\s*[-*]\s*\`.*\`" CLAUDE.md | grep -vE "test|lint|check|build|coverage" | sed -E 's/.*`([^`]+)`.*/\1/')

if [[ -n "$ADDITIONAL_CMDS" ]]; then
    echo "Found additional quality commands - running them (failures are warnings only):"
    while IFS= read -r cmd; do
        if [[ -n "$cmd" ]]; then
            echo "Executing: $cmd"
            eval "$cmd" || echo "⚠️  Command failed (non-critical): $cmd"
        fi
    done <<< "$ADDITIONAL_CMDS"
fi

echo "🎉 All quality checks passed - ready for commit!"
```

**Quality Assurance Checklist:**

- [ ] **Code formatting**: Consistent style per project standards
- [ ] **Static analysis**: No lint warnings or errors (using CLAUDE.md commands)
- [ ] **Security scan**: No security vulnerabilities (if security tools configured)
- [ ] **Performance**: Benchmarks within acceptable ranges (if configured in CLAUDE.md)
- [ ] **Documentation**: Code properly commented per project standards
- [ ] **Error handling**: Comprehensive error coverage

**NOTE**: All quality checks must use commands and standards documented in CLAUDE.md.

### 7. 📝 Commit Changes with Conventional Commits

**PREREQUISITE**: Only proceed if ALL local tests, builds, and quality checks pass.

Never mention that commits were generated or co-authored by Claude Code or any AI.

```bash
# BASH: FINAL MANDATORY verification before committing
echo "=== FINAL PRE-COMMIT VERIFICATION ==="

# Re-extract commands from CLAUDE.md to ensure consistency
TEST_CMD=$(grep -E "^\s*[-*]\s*\`.*test.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
LINT_CMD=$(grep -E "^\s*[-*]\s*\`.*check.*\`|^\s*[-*]\s*\`.*lint.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
BUILD_CMD=$(grep -E "^\s*[-*]\s*\`.*build.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")

# Re-run critical checks to ensure nothing is broken
if [[ -n "$TEST_CMD" ]] && ! eval "$TEST_CMD"; then
    echo "❌ ABORT: Tests failing - DO NOT COMMIT"
    echo "Test command: $TEST_CMD"
    exit 1
fi

if [[ -n "$LINT_CMD" ]] && ! eval "$LINT_CMD"; then
    echo "❌ ABORT: Static analysis failing - DO NOT COMMIT"
    echo "Lint command: $LINT_CMD"
    exit 1
fi

if [[ -n "$BUILD_CMD" ]] && ! eval "$BUILD_CMD"; then
    echo "❌ ABORT: Build failing - DO NOT COMMIT"
    echo "Build command: $BUILD_CMD"
    exit 1
fi

echo "✅ All checks passed - proceeding with commit"

# BASH: Stage only relevant files (avoid git add .)
git add <specific_files>

# BASH: Review staged changes thoroughly
git status
git diff --staged

# BASH: Verify no unintended changes
git diff --staged --name-only
git diff --staged --stat

# BASH: Test staged changes in isolation
echo "Testing staged changes in isolation..."
git stash --keep-index --include-untracked
if [[ -n "$TEST_CMD" ]] && ! eval "$TEST_CMD"; then
    echo "❌ ABORT: Staged changes break tests"
    echo "Test command: $TEST_CMD"
    git stash pop
    exit 1
fi
git stash pop

# BASH: Commit with conventional commit format
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

### Changes
- Detailed change 1 with specific impact
- Detailed change 2 with implementation notes
- Address security/performance requirements

### Implementation Details
- <specific_technical_details>
- <security_measures_implemented>
- <performance_considerations>

### Testing
- Added unit tests with X% coverage
- Implemented integration tests
- Security validation tests included

Closes #<issue_number>
EOF
)"

echo "✅ Commit successful - all local validation passed"
```

**Commit Message Guidelines:**

#### Commit Types
- `feat:` - New feature implementation
- `fix:` - Bug fix
- `refactor:` - Code refactoring without feature changes
- `test:` - Adding or updating tests
- `docs:` - Documentation updates
- `security:` - Security-related changes
- `perf:` - Performance improvements

#### Message Structure
- **Header**: `<type>(<scope>): <description>`
- **Body**: Detailed explanation of changes
- **Footer**: Issue references and breaking changes

### 8. 🚀 Push & Pipeline Monitoring

```bash
# BASH: Push changes to remote
git push

# Wait for pipeline to start
sleep 15

# TOOL CALL: Monitor pipeline status
# gitlab_list_pipelines --project_id <project_id> --ref <branch_name> --per_page 3

# BASH: Continuous pipeline monitoring
PIPELINE_ID="<latest_pipeline_id>"
while true; do
    # TOOL CALL: Get current pipeline status
    # PIPELINE_STATUS=$(gitlab_get_pipeline --project_id <project_id> --pipeline_id $PIPELINE_ID)
    
    if [[ "$PIPELINE_STATUS" == "success" ]]; then
        echo "✅ Pipeline successful!"
        break
    elif [[ "$PIPELINE_STATUS" == "failed" ]]; then
        echo "❌ Pipeline failed! Investigating..."
        
        # TOOL CALL: Get failed jobs
        # gitlab_get_pipeline_jobs --project_id <project_id> --pipeline_id $PIPELINE_ID --scope failed
        
        # TOOL CALL: Get job logs for debugging
        # for job_id in $(failed_jobs); do
        #     gitlab_get_job_log --project_id <project_id> --job_id $job_id
        # done
        
        break
    else
        echo "⏳ Pipeline status: $PIPELINE_STATUS - waiting..."
        sleep 60
    fi
done
```

**Pipeline Failure Resolution Protocol:**

#### Common Pipeline Issues
1. **Test Failures**: Analyze test output, fix code, re-push
2. **Lint Errors**: Run local linting, fix issues, re-push
3. **Build Failures**: Check compilation errors, fix syntax, re-push
4. **Security Scans**: Review security findings, implement fixes
5. **Coverage Issues**: Add missing tests, improve coverage

#### Resolution Steps
```bash
# For each pipeline failure:
1. Analyze specific job failure logs
2. Reproduce issue locally if possible
3. Implement targeted fix
4. Test fix locally
5. Commit and push fix
6. Monitor new pipeline
```

### 9. 📋 Create/Update Merge Request

Never mention that MR content was generated by AI.

```bash
# TOOL CALL: Check if MR exists for current branch
# gitlab_list_merge_requests --project_id <project_id> --source_branch <current_branch>

# If no MR exists, create one:
# TOOL CALL: Create comprehensive merge request
# gitlab_create_merge_request \
#   --project_id <project_id> \
#   --source_branch <branch_name> \
#   --target_branch main \
#   --title "<type>: <descriptive_title> - Issue #<issue_number>" \
#   --description "$(cat <<'EOF'
# ## 🎯 Implementation Overview
# 
# This MR implements [brief description] to resolve issue #<issue_number>.
# 
# ## 🔧 Technical Implementation
# 
# ### Core Changes
# - **[Component 1]**: [Specific implementation details]
# - **[Component 2]**: [Specific implementation details]
# - **[Component 3]**: [Specific implementation details]
# 
# ### New Features
# - [Feature 1 with technical details]
# - [Feature 2 with technical details]
# 
# ### Security Enhancements
# - [Security measure 1]
# - [Security measure 2]
# 
# ## 🧪 Testing & Validation
# 
# ### Test Coverage
# - **Unit Tests**: [Coverage percentage] coverage for new functionality
# - **Integration Tests**: [Description of integration scenarios tested]
# - **Security Tests**: [Security validation implemented]
# - **Performance Tests**: [Performance benchmarks and results]
# 
# ### Manual Testing
# - [Manual test scenario 1]
# - [Manual test scenario 2]
# 
# ## 📊 Performance Impact
# 
# ### Benchmarks
# - [Performance metric 1]: [Before vs After]
# - [Performance metric 2]: [Before vs After]
# 
# ### Resource Usage
# - Memory: [Impact assessment]
# - CPU: [Impact assessment]
# 
# ## 🔒 Security Considerations
# 
# ### Security Measures Implemented
# - [Security control 1]
# - [Security control 2]
# 
# ### Risk Assessment
# - [Risk category 1]: [Mitigation strategy]
# - [Risk category 2]: [Mitigation strategy]
# 
# ## 📋 Acceptance Criteria Verification
# 
# ### Requirements Met
# - [x] [Requirement 1 from issue]
# - [x] [Requirement 2 from issue]
# - [x] [Requirement 3 from issue]
# 
# ### Additional Enhancements
# - [x] [Enhancement 1]
# - [x] [Enhancement 2]
# 
# ## 🚀 Deployment Notes
# 
# ### Migration Requirements
# - [Migration step 1 if needed]
# - [Migration step 2 if needed]
# 
# ### Configuration Changes
# - [Config change 1 if needed]
# - [Config change 2 if needed]
# 
# ## 📚 Documentation Updates
# 
# - [x] Code properly commented
# - [x] API documentation updated (if applicable)
# - [x] README updated (if applicable)
# 
# ---
# 
# **Ready for Review**: All tests passing, pipeline green, requirements implemented.
# 
# Closes #<issue_number>
# EOF
# )"

# If MR exists, update it:
# TOOL CALL: Update existing merge request
# gitlab_update_merge_request \
#   --project_id <project_id> \
#   --merge_request_iid <mr_iid> \
#   --description "<updated_description>"
```

**MR Description Quality Standards:**

#### Required Sections
1. **Implementation Overview**: High-level summary
2. **Technical Implementation**: Detailed technical changes
3. **Testing & Validation**: Comprehensive test coverage
4. **Performance Impact**: Benchmarks and analysis
5. **Security Considerations**: Security measures and risk assessment
6. **Acceptance Criteria**: Requirements verification
7. **Deployment Notes**: Migration and config requirements

#### Content Quality Guidelines
- **Specific and detailed**: Avoid generic descriptions
- **Technically accurate**: Include actual implementation details
- **Reviewer-friendly**: Easy to understand and validate
- **Complete**: All aspects of implementation covered

### 10. ✅ Final Verification & Quality Check

```bash
# TOOL CALL: Verify MR creation/update
# gitlab_get_merge_request --project_id <project_id> --merge_request_iid <mr_iid>

# BASH: Final comprehensive verification
echo "=== Final Verification Checklist ==="

# Verify all tests pass
make test && echo "✅ All tests passing" || echo "❌ Tests failing"

# Verify pipeline status
# TOOL CALL: Get latest pipeline status
# gitlab_get_pipeline --project_id <project_id> --pipeline_id <latest_pipeline_id>

# Verify code quality
make check && echo "✅ Code quality checks pass" || echo "❌ Quality issues"

# Verify no uncommitted changes
[[ -z $(git status --porcelain) ]] && echo "✅ No uncommitted changes" || echo "❌ Uncommitted changes exist"

# TOOL CALL: Mark all tasks as completed
# TodoWrite: [all_tasks_with_completed_status]

echo "=== Implementation Summary ==="
echo "✅ Issue requirements implemented"
echo "✅ Comprehensive tests added"
echo "✅ Code quality verified"
echo "✅ Pipeline successful"
echo "✅ Merge request ready for review"
echo "✅ All acceptance criteria met"
```

**Final Quality Verification:**

- [ ] **Functionality**: All requirements implemented correctly
- [ ] **Testing**: Comprehensive test coverage with passing tests
- [ ] **Code Quality**: No lint errors, follows conventions
- [ ] **Security**: Security measures implemented and tested
- [ ] **Performance**: No significant performance regressions
- [ ] **Documentation**: Code properly documented
- [ ] **Pipeline**: All CI/CD jobs passing
- [ ] **MR Quality**: Detailed, accurate merge request description

## Quality Standards

### Implementation Quality Checklist

- [ ] **Requirements Coverage**: All acceptance criteria addressed
- [ ] **Code Architecture**: Clean, maintainable, scalable design
- [ ] **Security Implementation**: Proper input validation and security controls
- [ ] **Error Handling**: Comprehensive error handling and recovery
- [ ] **Performance**: Optimized for performance and resource usage
- [ ] **Testing**: Thorough test coverage including edge cases
- [ ] **Documentation**: Clear code comments and API documentation

### Code Review Readiness

- [ ] **Self-Review**: Code reviewed as if reviewing others' work
- [ ] **Convention Compliance**: Follows established code patterns
- [ ] **Security Audit**: No security vulnerabilities introduced
- [ ] **Performance Validation**: Benchmarks within acceptable ranges
- [ ] **Integration Testing**: Works properly with existing systems
- [ ] **Edge Case Handling**: Robust handling of edge cases and errors

### Merge Request Excellence

- [ ] **Descriptive Title**: Clear, specific title following conventions
- [ ] **Comprehensive Description**: Detailed technical implementation overview
- [ ] **Requirements Mapping**: Clear mapping to acceptance criteria
- [ ] **Testing Evidence**: Test results and coverage information
- [ ] **Security Analysis**: Security implications and measures documented
- [ ] **Performance Data**: Performance impact analysis included

## ⚠️ CRITICAL: Avoid Pipeline Waste

**NEVER commit and push code without thorough local testing.** This wastes CI/CD resources and time:

- ❌ **Don't do this**: Implement → commit → push → wait for pipeline to fail → fix → repeat
- ✅ **Do this instead**: Implement → test locally using CLAUDE.md commands → build locally → lint locally → commit → push confidently

**All local validation must pass using project-specific commands from CLAUDE.md before any commit. No exceptions.**

**IMPORTANT**: These workflows do not assume any particular technology or build system. All commands must be documented in CLAUDE.md as per previous workflow instructions.

## Best Practices

### Implementation Approach

- **Local-First Development**: ALWAYS test, build, and validate locally before committing
- **Incremental Development**: Build functionality incrementally with frequent testing
- **Security-First**: Consider security implications at every step
- **Performance-Aware**: Monitor performance impact throughout development
- **Test-Driven**: Write tests alongside implementation
- **Documentation-Concurrent**: Document as you implement
- **Pipeline Efficiency**: Never waste CI/CD resources by pushing untested code

### Code Quality Standards

- **Consistency**: Follow existing code patterns and conventions
- **Readability**: Write self-documenting, clear code
- **Maintainability**: Design for future maintenance and extension
- **Robustness**: Handle errors gracefully and provide helpful error messages
- **Efficiency**: Optimize for performance without sacrificing readability

### Testing Excellence

- **Comprehensive Coverage**: Test all code paths including error conditions
- **Realistic Scenarios**: Test with realistic data and usage patterns
- **Edge Cases**: Thoroughly test boundary conditions
- **Integration Validation**: Test interactions between components
- **Performance Testing**: Include performance and load testing

### Git and Pipeline Management

- **Local Validation First**: NEVER commit without passing local tests, builds, and linting
- **Atomic Commits**: Make focused, single-purpose commits
- **Descriptive Messages**: Write clear, detailed commit messages
- **Pipeline Efficiency**: Only push after confident local validation to avoid wasting resources
- **Pipeline Monitoring**: Actively monitor and fix pipeline issues when they do occur
- **Branch Hygiene**: Keep branches focused and up-to-date

## Error Handling & Recovery

### Common Implementation Issues

#### 1. **Compilation/Build Errors**
```bash
# BASH: Detailed error analysis
make build 2>&1 | tee build_errors.log
go build -v ./... 2>&1 | head -20

# Recovery approach:
1. Fix syntax errors first
2. Resolve import/dependency issues
3. Check for type mismatches
4. Verify all required files exist
5. Update dependencies if needed
```

#### 2. **Test Failures**
```bash
# BASH: Isolate and analyze failing tests
make test 2>&1 | tee test_output.log
grep -A 10 -B 5 "FAIL\|ERROR" test_output.log

# BASH: Run specific failing tests
go test -v ./path/to/package -run TestSpecificFunction
npm test -- --testNamePattern="specific test"

# Recovery approach:
1. Understand why test is failing
2. Fix underlying issue, not just the test
3. Verify fix doesn't break other functionality
4. Add regression test if needed
```

#### 3. **Security Scan Failures**
```bash
# BASH: Analyze security findings
gosec -fmt json ./... > security_report.json
cat security_report.json | jq '.Issues[]'

# Recovery approach:
1. Assess severity of security findings
2. Implement proper input validation
3. Fix SQL injection vulnerabilities
4. Address XSS and other injection attacks
5. Remove hardcoded credentials
```

#### 4. **Performance Regressions**
```bash
# BASH: Performance comparison
go test -bench=. -benchmem ./... > current_bench.txt
# Compare with baseline benchmarks

# Recovery approach:
1. Identify performance bottlenecks
2. Profile CPU and memory usage
3. Optimize algorithms and data structures
4. Consider caching strategies
5. Implement lazy loading where appropriate
```

#### 5. **Pipeline Timeouts**
```bash
# TOOL CALL: Investigate resource usage
# gitlab_get_job_log --project_id <project_id> --job_id <job_id>

# Look for:
- Infinite loops in code or tests
- Deadlocks in concurrent operations
- Memory leaks causing out-of-memory
- Network timeouts and connectivity issues

# Recovery approach:
1. Add appropriate timeouts to operations
2. Implement circuit breakers for external calls
3. Add resource monitoring and limits
4. Optimize resource-intensive operations
```

### Recovery Strategies

#### Critical Issues
- **Breaking Changes**: Implement feature flags, gradual rollout
- **Security Vulnerabilities**: Immediate fix with security review
- **Performance Issues**: Profile and optimize critical paths
- **Data Corruption**: Implement data validation and recovery procedures

#### Development Issues
- **Merge Conflicts**: Regular rebasing, clear communication
- **Dependencies**: Version pinning, dependency auditing
- **Environment Issues**: Consistent development environments
- **Documentation**: Maintain up-to-date documentation

## Tools Reference

### Tool Categories and Usage

#### GitLab API Tools (MCP)
- `gitlab_get_project_id`: Extract project ID from git remote
- `gitlab_get_issue`: Fetch detailed issue information
- `gitlab_list_merge_requests`: List MRs for branch
- `gitlab_create_merge_request`: Create new MR
- `gitlab_update_merge_request`: Update existing MR
- `gitlab_list_pipelines`: Monitor pipeline status
- `gitlab_get_pipeline`: Get pipeline details
- `gitlab_get_pipeline_jobs`: Get job details
- `gitlab_get_job_log`: Debug pipeline failures

#### File Management Tools
- `Read`: Read file contents for analysis
- `Write`: Create new files
- `Edit`: Make single file edits
- `MultiEdit`: Make multiple edits to single file
- `Glob`: Find files by pattern
- `Grep`: Search file contents

#### Development Tools
- `Task`: Comprehensive codebase analysis
- `TodoWrite/TodoRead`: Task management and progress tracking
- `Bash`: Execute development commands and tools

#### Standard Development Commands
- `git`: Version control operations
- `make`: Build and test operations
- `go`: Go language tools (build, test, fmt, vet)
- `npm`: Node.js package management and scripts

---

This workflow ensures systematic, high-quality implementation from issue analysis through merge request preparation, maintaining code excellence and clear communication throughout the development process.