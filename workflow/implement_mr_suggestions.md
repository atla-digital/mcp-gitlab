# Workflow: Implementing Merge Request Suggestions

This document outlines the standardized workflow for implementing code review suggestions from GitLab merge requests, testing changes, and resolving discussion threads.

**🔧 TECHNOLOGY-AGNOSTIC WORKFLOW**: This workflow does not assume any specific programming language, framework, or build system. All project-specific commands (test, build, lint, etc.) must be documented in the project's CLAUDE.md file. Examples in this document use pseudo-commands like `<PROJECT_TEST_COMMAND>` which should be replaced with actual project commands.

## Prerequisites

- Access to GitLab MCP tools for merge request management
- Local development environment with testing capabilities
- Git repository with appropriate branch permissions

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

# BASH: Get current MR information from git remote
git remote get-url origin
# Extract project_id and current branch
CURRENT_BRANCH=$(git branch --show-current)
REMOTE_URL=$(git remote get-url origin)

# BASH: Verify we're on a feature branch (not main/master)
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "Error: Cannot implement changes on main branch"
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
- [ ] Current branch has associated merge request

### 1. 📋 Task Planning & Setup

```bash
# TOOL CALL: Use TodoWrite tool to create task breakdown
# TodoWrite: [
#   {"id": "1", "content": "Fetch and analyze merge request comments", "status": "pending", "priority": "high"},
#   {"id": "2", "content": "Implement suggested code changes", "status": "pending", "priority": "high"},
#   {"id": "3", "content": "Run tests and verify implementation", "status": "pending", "priority": "high"},
#   {"id": "4", "content": "Commit changes using conventional commits", "status": "pending", "priority": "medium"},
#   {"id": "5", "content": "Push changes to remote repository", "status": "pending", "priority": "medium"},
#   {"id": "6", "content": "Monitor pipeline status and fix issues", "status": "pending", "priority": "high"},
#   {"id": "7", "content": "Reply to and resolve discussion threads", "status": "pending", "priority": "medium"}
# ]
```

### 2. 🔍 Fetch & Analyze Comments

```bash
# TOOL CALL: Get project information
# gitlab_get_project_id --remote_url <git_remote_url>

# TOOL CALL: List merge request discussions
# gitlab_list_merge_request_discussions --project_id <project_id> --merge_request_iid <mr_iid>

# TOOL CALL: Get specific discussion details if needed
# gitlab_get_merge_request_discussion --project_id <project_id> --merge_request_iid <mr_iid> --discussion_id <discussion_id>
```

**Analysis Checklist:**

- [ ] Identify discussion threads requiring code changes
- [ ] Categorize suggestions (bug fixes, improvements, race conditions, etc.)
- [ ] Note file paths and line numbers mentioned
- [ ] Assess scope and complexity of changes

### 3. 🔨 Implementation Phase

```bash
# TOOL CALL: Mark implementation task as in_progress
# TodoWrite: [{"id": "2", "status": "in_progress", ...}]

# TOOL CALL: Read relevant files
# Read --file_path <target_file_path>

# TOOL CALL: Implement changes using Edit or MultiEdit
# Edit --file_path <file_path> --old_string <old_code> --new_string <new_code>

# TOOL CALL: Validate changes after each edit
# Read --file_path <file_path> --offset <modified_line_start> --limit <lines_to_check>

# BASH: Verify syntax/compilation using project-specific commands
# NOTE: Use commands documented in CLAUDE.md, not hardcoded assumptions
# Example: eval "<PROJECT_VALIDATION_COMMAND>" where command comes from CLAUDE.md
```

**Implementation Guidelines:**

- Read existing code first to understand context
- Follow existing code conventions and patterns documented in the project
- Make atomic, focused changes per suggestion
- Add appropriate comments if complex logic is involved
- Use project-specific build and test commands as documented in CLAUDE.md

### 4. 🧪 Testing & Verification

**MANDATORY**: All tests must pass locally before committing. Never commit and push without local verification.

```bash
# BASH: Read project-specific commands from CLAUDE.md
echo "Reading project commands from CLAUDE.md..."

if [[ ! -f "CLAUDE.md" ]]; then
    echo "❌ CLAUDE.md file not found - this file should contain project-specific build and test commands"
    echo "Please create CLAUDE.md with the following sections:"
    echo "- Test command (e.g., '\`<PROJECT_TEST_COMMAND>\` - Run all tests')"
    echo "- Lint/check command (e.g., '\`<PROJECT_LINT_COMMAND>\` - Run static analysis')"
    echo "- Build command (e.g., '\`<PROJECT_BUILD_COMMAND>\` - Build the project')"
    echo ""
    echo "NOTE: Replace <PROJECT_*_COMMAND> with your project's actual commands."
    echo "Refer to previous instructions in this workflow for proper command documentation."
    exit 1
fi

# BASH: Extract commands from CLAUDE.md (look for common patterns)
echo "Extracting build and test commands from CLAUDE.md..."

# Look for test commands in CLAUDE.md
TEST_CMD=$(grep -E "^\s*[-*]\s*\`.*test.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || \
           grep -E "test.*command|how to test" CLAUDE.md -A 1 | grep -E "^\s*[-*]\s*\`.*\`" | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || \
           echo "")

# Look for lint/check commands in CLAUDE.md  
LINT_CMD=$(grep -E "^\s*[-*]\s*\`.*check.*\`|^\s*[-*]\s*\`.*lint.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || \
           grep -E "lint.*command|check.*command|static.*analysis" CLAUDE.md -A 1 | grep -E "^\s*[-*]\s*\`.*\`" | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || \
           echo "")

# Look for build commands in CLAUDE.md
BUILD_CMD=$(grep -E "^\s*[-*]\s*\`.*build.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || \
            grep -E "build.*command|how to build" CLAUDE.md -A 1 | grep -E "^\s*[-*]\s*\`.*\`" | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || \
            echo "")

echo "Found commands in CLAUDE.md:"
echo "Test command: $TEST_CMD"
echo "Lint command: $LINT_CMD"
echo "Build command: $BUILD_CMD"

if [[ -z "$TEST_CMD" ]]; then
    echo "❌ No test command found in CLAUDE.md"
    echo "Please add test instructions to CLAUDE.md (e.g., '- \`<PROJECT_TEST_COMMAND>\` - Run all tests')"
    echo "Replace <PROJECT_TEST_COMMAND> with your project's actual test command."
    echo "Refer to CLAUDE.md documentation format in previous workflow instructions."
    exit 1
fi

# BASH: MANDATORY - Run comprehensive tests and ensure they pass
echo "Running comprehensive test suite..."
echo "Executing: $TEST_CMD"
if eval "$TEST_CMD"; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed - DO NOT COMMIT until fixed"
    echo "Command used: $TEST_CMD"
    exit 1
fi

# BASH: MANDATORY - Run static analysis if available
if [[ -n "$LINT_CMD" ]]; then
    echo "Running static analysis..."
    echo "Executing: $LINT_CMD"
    if eval "$LINT_CMD"; then
        echo "✅ Static analysis passed"
    else
        echo "❌ Static analysis failed - DO NOT COMMIT until fixed"
        echo "Command used: $LINT_CMD"
        exit 1
    fi
else
    echo "⚠️  No lint command configured in CLAUDE.md - skipping static analysis"
fi

# BASH: MANDATORY - Verify build if available
if [[ -n "$BUILD_CMD" ]]; then
    echo "Verifying build..."
    echo "Executing: $BUILD_CMD"
    if eval "$BUILD_CMD"; then
        echo "✅ Build successful"
    else
        echo "❌ Build failed - DO NOT COMMIT until fixed"
        echo "Command used: $BUILD_CMD"
        exit 1
    fi
else
    echo "⚠️  No build command configured in CLAUDE.md - skipping build verification"
fi

# BASH: Look for additional commands in CLAUDE.md (benchmarks, security scans, etc.)
echo "Checking for additional validation commands..."
ADDITIONAL_CMDS=$(grep -E "^\s*[-*]\s*\`.*\`" CLAUDE.md | grep -vE "test|lint|check|build" | sed -E 's/.*`([^`]+)`.*/\1/')

if [[ -n "$ADDITIONAL_CMDS" ]]; then
    echo "Found additional commands - running them (failures are warnings only):"
    while IFS= read -r cmd; do
        if [[ -n "$cmd" ]]; then
            echo "Executing: $cmd"
            eval "$cmd" || echo "⚠️  Command failed (non-critical): $cmd"
        fi
    done <<< "$ADDITIONAL_CMDS"
fi

echo "🎉 All local validation passed - ready to commit!"
```

**MANDATORY Testing Checklist - Must Complete Before Committing:**

- [ ] **All existing tests pass locally using commands from CLAUDE.md** (REQUIRED)
- [ ] **Static analysis/linting passes locally using commands from CLAUDE.md** (REQUIRED) 
- [ ] **Code compiles/builds successfully locally using commands from CLAUDE.md** (REQUIRED)
- [ ] **New functionality works as expected** (REQUIRED)
- [ ] **No regressions introduced** (REQUIRED)
- [ ] **Edge cases handled appropriately** (REQUIRED)
- [ ] **Performance benchmarks within acceptable ranges** (if applicable and configured in CLAUDE.md)

**NOTE**: All build, test, and quality commands must be documented in CLAUDE.md as per previous workflow instructions.

### 5. 📝 Commit Changes

**PREREQUISITE**: Only proceed if all local tests, linting, and builds pass successfully.

While formulating your commit message, ensure it follows the conventional commit format. Stage only relevant files to avoid unnecessary changes. Never mention that it was generated or Co-authored by Claude Code or any AI.

```bash
# BASH: Final verification before committing (re-read commands from CLAUDE.md)
echo "Final pre-commit verification..."

# Re-extract commands from CLAUDE.md to ensure consistency
TEST_CMD=$(grep -E "^\s*[-*]\s*\`.*test.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
LINT_CMD=$(grep -E "^\s*[-*]\s*\`.*check.*\`|^\s*[-*]\s*\`.*lint.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
BUILD_CMD=$(grep -E "^\s*[-*]\s*\`.*build.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")

if [[ -n "$TEST_CMD" ]] && ! eval "$TEST_CMD"; then
    echo "❌ ABORT: Tests are failing - fix before committing"
    echo "Command: $TEST_CMD"
    exit 1
fi

if [[ -n "$LINT_CMD" ]] && ! eval "$LINT_CMD"; then
    echo "❌ ABORT: Linting/static analysis failing - fix before committing"
    echo "Command: $LINT_CMD"
    exit 1
fi

if [[ -n "$BUILD_CMD" ]] && ! eval "$BUILD_CMD"; then
    echo "❌ ABORT: Build failing - fix before committing"
    echo "Command: $BUILD_CMD"
    exit 1
fi

echo "✅ All verifications passed - proceeding with commit"

# BASH: Stage only relevant files (avoid git add .)
git add <specific_files>

# BASH: Check staged changes
git status
git diff --staged

# BASH: Verify staged changes don't break anything
echo "Verifying staged changes..."
git stash --keep-index --include-untracked
if [[ -n "$TEST_CMD" ]] && ! eval "$TEST_CMD"; then
    echo "❌ ABORT: Staged changes break tests"
    echo "Command: $TEST_CMD"
    git stash pop
    exit 1
fi
git stash pop

# Commit with conventional commit format
git commit -m "$(cat <<'EOF'
<type>: <description>

- Detailed change 1
- Detailed change 2
- Address specific issue mentioned in review

This addresses <issue_reference> by implementing <solution_summary>.
EOF
)"
```

**Commit Message Format:**

- **Type**: `fix:`, `feat:`, `refactor:`, `test:`, etc.
- **Description**: Clear, concise summary
- **Body**: Bullet points explaining changes
- **Footer**: Reference to issue/MR and tools used

### 6. 🚀 Push & Pipeline Monitoring

```bash
# BASH: Push changes
git push

# Wait 10 seconds, then check pipeline
sleep 10
# TOOL CALL: List recent pipelines
# gitlab_list_pipelines --project_id <project_id> --ref <branch_name> --per_page 5

# Monitor pipeline status every 60 seconds until completion
while pipeline_status != "success":
    sleep 60
    # TOOL CALL: Get pipeline status
    # gitlab_get_pipeline --project_id <project_id> --pipeline_id <pipeline_id>

    # TOOL CALL: If pipeline fails, check jobs
    # gitlab_get_pipeline_jobs --project_id <project_id> --pipeline_id <pipeline_id>

    # TOOL CALL: Get detailed logs for failed jobs
    # for job in $(gitlab_get_pipeline_jobs --project_id <project_id> --pipeline_id <pipeline_id> --scope failed); do
    #     echo "=== Job $job logs ==="
    #     gitlab_get_job_log --project_id <project_id> --job_id $job
    #     echo "====================="
    # done

    # Fix issues, commit, push, repeat until success
```

**Pipeline Monitoring Protocol:**

- Check status every 60 seconds
- If failed, examine job logs for specific failures
- Fix issues immediately and re-push
- Continue until pipeline succeeds

### 7. 💬 Reply to Discussions

For each discussion thread that was addressed (never mention that replies were generated by AI):

```bash
# TOOL CALL: Reply with implementation details
# gitlab_reply_to_discussion \
#   --project_id <project_id> \
#   --merge_request_iid <mr_iid> \
#   --discussion_id <discussion_id> \
#   --body "✅ **Implemented!** <detailed_explanation>

## Changes Made:
- Specific change 1
- Specific change 2

## Testing:
- Test results summary
- Coverage information

The <issue_type> has been resolved by <solution_summary>."
```

### 8. ✅ Resolve Discussions

```bash
# TOOL CALL: Mark discussion as resolved
# gitlab_resolve_discussion \
#   --project_id <project_id> \
#   --merge_request_iid <mr_iid> \
#   --discussion_id <discussion_id> \
#   --resolved true
```

**Resolution Criteria:**

- Code changes fully address the suggestion
- Tests pass and verify the fix
- Pipeline is successful
- Clear explanation provided in reply

**When NOT to Resolve Discussions:**

- [ ] **Awaiting clarification**: When the suggestion is unclear or ambiguous
- [ ] **Requires architecture decision**: Changes affect system design and need team input
- [ ] **Performance concerns**: Implementation might impact performance significantly
- [ ] **Breaking changes**: Suggestion would break backward compatibility
- [ ] **Security implications**: Changes could introduce security vulnerabilities
- [ ] **Partial implementation**: Only part of a multi-step suggestion is complete
- [ ] **Test coverage insufficient**: Changes lack adequate test coverage
- [ ] **Documentation needed**: Complex changes require documentation updates

### 9. 📊 Verification & Documentation Updates

```bash
# Verify changes actually fix reported issues
# Re-run specific test cases mentioned in discussions
# Test edge cases identified in review comments

# BASH: Check if documentation needs updates
find . -name "*.md" -o -name "*.rst" | xargs grep -l "<relevant_keywords>"

# TOOL CALL: Update documentation if needed
# Edit --file_path <doc_file> --old_string <outdated_info> --new_string <updated_info>

# BASH: Verify API contracts haven't changed unexpectedly
go test -json ./... | jq '.Action == "pass"'
# or
npm run test:api
```

### 10. 📊 Final Status Update

```bash
# TOOL CALL: Mark all todos as completed
# TodoWrite: [all_tasks_with_completed_status]

# TOOL CALL: Summary verification
# gitlab_list_merge_request_discussions --project_id <project_id> --merge_request_iid <mr_iid>

# BASH: Final verification checklist
echo "Final verification complete:"
echo "✅ All tests passing"
echo "✅ Pipeline successful"
echo "✅ All discussions addressed"
echo "✅ Documentation updated (if needed)"
echo "✅ No regressions introduced"
```

## Quality Assurance

### Pre-Implementation Checklist

- [ ] **Understanding**: Fully understand each suggestion and its impact
- [ ] **Scope assessment**: Changes are minimal and focused
- [ ] **Risk evaluation**: No breaking changes or security implications
- [ ] **Test strategy**: Plan for testing changes thoroughly

### Implementation Quality Checklist

- [ ] **Code review self-check**: Review own changes as if reviewing others' code
- [ ] **Convention compliance**: Follows existing code style and patterns
- [ ] **Error handling**: Proper error handling for new code paths
- [ ] **Edge cases**: Consider and handle edge cases
- [ ] **Resource cleanup**: No memory leaks or resource leaks introduced

### Performance Impact Assessment

- [ ] **Benchmark comparison**: Run benchmarks before/after changes
- [ ] **Memory usage**: Monitor memory consumption changes
- [ ] **CPU impact**: Check for CPU-intensive operations
- [ ] **Database queries**: Ensure no N+1 queries or inefficient operations
- [ ] **Network calls**: Minimize external API calls and handle failures

### Security Consideration Checkpoint

- [ ] **Input validation**: All user inputs properly validated
- [ ] **SQL injection**: No dynamic SQL construction
- [ ] **XSS prevention**: Output properly escaped
- [ ] **Authentication**: No bypass of authentication mechanisms
- [ ] **Authorization**: Proper permission checks maintained
- [ ] **Secrets**: No hardcoded secrets or credentials
- [ ] **Logging**: No sensitive data in logs

### Final Completion Checklist

Before marking the workflow complete, verify:

- [ ] **All suggestions addressed**: Every discussion thread has been responded to
- [ ] **Code quality maintained**: No regressions, follows conventions
- [ ] **Tests passing**: Full test suite runs successfully
- [ ] **Pipeline green**: All CI/CD jobs complete successfully
- [ ] **Documentation updated**: If architectural changes were made
- [ ] **Discussions resolved**: Threads marked as resolved with clear explanations
- [ ] **Performance verified**: No significant performance regressions
- [ ] **Security reviewed**: No new security vulnerabilities introduced

## ⚠️ CRITICAL: Avoid Pipeline Waste

**NEVER push code that hasn't been fully tested locally.** This is wasteful and inefficient:

- ❌ **Don't do this**: Make changes → commit → push → wait for pipeline to fail → fix → repeat
- ✅ **Do this instead**: Make changes → test locally using CLAUDE.md commands → fix issues → commit → push confidently

**Local testing is mandatory before any commit. Use project-specific commands documented in CLAUDE.md. This saves time and resources.**

**IMPORTANT**: All build, test, and quality commands are project-specific and must be documented in CLAUDE.md. These workflows do not assume any particular technology stack.

## Best Practices

### Code Changes

- **Local Testing Mandatory**: ALWAYS test locally before committing to avoid pipeline waste
- Make minimal, focused changes that directly address feedback
- Preserve existing functionality unless explicitly changing it
- Follow established patterns and conventions in the codebase
- Add tests for new functionality or edge cases

### Communication

- Provide detailed explanations in discussion replies
- Include specific code snippets when relevant
- Reference line numbers and file paths for clarity
- Thank reviewers for valuable feedback
- Never reveal AI assistance in any communications

### Pipeline Management

- Monitor pipelines actively - don't leave them running unattended
- Fix pipeline failures immediately rather than batching fixes
- Ensure all jobs pass, not just the overall pipeline status
- Check coverage reports and quality metrics

### Git Hygiene

- Use conventional commit messages
- Stage only files relevant to the changes
- Avoid committing unrelated changes or temporary files
- Keep commit history clean and focused

## Error Handling

### Common Issues & Specific Recovery Procedures

#### 1. **Test Failures**
```bash
# BASH: Isolate failing tests
make test 2>&1 | tee test_output.log
grep -A 10 -B 5 "FAIL" test_output.log

# BASH: Run specific failing test
go test -v ./path/to/package -run TestSpecificFunction
# or
npm test -- --testNamePattern="specific test"

# Recovery:
1. Analyze test output for root cause
2. Fix underlying issue, not just the test
3. Verify fix doesn't break other tests
4. Consider adding regression test
```

#### 2. **Merge Conflicts**
```bash
# BASH: Prevention: Update branch before starting
git fetch origin
git rebase origin/main

# BASH: Resolution:
git status  # See conflicted files
git diff --name-only --diff-filter=U  # List conflict files
# Resolve conflicts manually
git add <resolved_files>
git rebase --continue
```

#### 3. **Pipeline Timeout**
```bash
# TOOL CALL: Investigate resource usage
# gitlab_get_job_log --project_id <project_id> --job_id <job_id>
# Look for:
- Infinite loops in test code
- Deadlocks in concurrent code
- Memory leaks causing OOM
- Network timeouts

# Recovery:
1. Add timeout constraints to problematic code
2. Implement circuit breakers for external calls
3. Add resource monitoring to tests
```

#### 4. **Missing Dependencies**
```bash
# BASH: Check dependency files
cat go.mod go.sum  # Go
cat package.json package-lock.json  # Node.js
cat requirements.txt  # Python

# BASH: Restore dependencies
go mod download && go mod tidy
# or
npm ci
# or
pip install -r requirements.txt
```

#### 5. **Compilation Errors**
```bash
# BASH: Get detailed error information
go build -v ./... 2>&1 | head -20
# or
npm run build 2>&1 | head -20

# Recovery:
1. Fix syntax errors first
2. Resolve import/dependency issues
3. Check for type mismatches
4. Verify all required files exist
```

### Recovery Actions

- **Pipeline fails repeatedly**: Create minimal reproduction case, bisect commits to find root cause
- **Discussions unclear**: Request specific examples, ask for preferred implementation approach
- **Breaking existing functionality**: Create emergency revert commit, analyze impact, implement safer approach
- **Performance regression**: Profile before/after, implement benchmarks, consider alternative solutions
- **Security concerns**: Consult security guidelines, consider threat model impact, get security review

## Tools Reference

### Tool Types Used in This Workflow

- **TOOL CALLS** (Claude Code tools - not bash executables):
  - `TodoWrite/TodoRead`: Task management and progress tracking
  - `gitlab_*`: GitLab API interactions for MR management  
  - `Read/Edit/MultiEdit`: File manipulation tools
  - `Grep/Glob`: Code search and file discovery

- **BASH COMMANDS** (executable shell commands):
  - `git`, `make`, `npm`, `go`: Standard development tools
  - `find`, `grep`, `sleep`: Unix utilities
  - `echo`, `cat`, `head`: Text processing commands

---

This workflow ensures systematic, high-quality implementation of merge request feedback while maintaining code quality and clear communication with reviewers.
