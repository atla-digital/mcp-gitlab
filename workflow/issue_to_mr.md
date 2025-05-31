# Workflow: From Issue to Merge Request

This document outlines the standardized workflow for analyzing GitLab issues, creating implementation plans, and generating merge requests with comprehensive strategic documentation.

**🔧 TECHNOLOGY-AGNOSTIC WORKFLOW**: This workflow does not assume any specific programming language, framework, or build system. All project-specific commands and requirements must be documented in the project's CLAUDE.md file. This workflow focuses on analysis and planning rather than implementation details.

## Prerequisites

- Access to GitLab MCP tools for issue and merge request management
- Local development environment with testing and analysis capabilities
- Git repository with appropriate branch permissions
- Understanding of project architecture and security considerations
- **CLAUDE.md file containing project-specific build, test, and quality commands**

**IMPORTANT**: This workflow is technology-agnostic. All project-specific commands (build, test, lint) must be documented in CLAUDE.md. These workflows do not assume any particular programming language or build system.

## Workflow Steps

### 0. 🔧 Initial Setup & Project Context

```bash
# BASH: Check current git status and ensure clean state
git status
if [[ $(git status --porcelain) ]]; then
    echo "Warning: Uncommitted changes detected. Commit or stash before proceeding."
    git status --short
    exit 1
fi

# BASH: Ensure we're on main branch for new feature branches
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo "Switching to main branch for new feature creation"
    git checkout main
    git pull origin main
fi

# BASH: Get project information
REMOTE_URL=$(git remote get-url origin)
echo "Working with repository: $REMOTE_URL"
```

**Setup Verification Checklist:**

- [ ] Working directory is clean (no uncommitted changes)
- [ ] Currently on main/master branch for new feature start
- [ ] Latest changes pulled from remote
- [ ] Git remote URL is accessible and correct
- [ ] Development environment is ready

### 1. 📋 Issue Analysis & Task Planning

```bash
# TOOL CALL: Set up project and issue identification
# gitlab_get_project_id --remote_url <git_remote_url>

# TOOL CALL: List open issues to select target
# gitlab_list_issues --project_id <project_id> --state opened

# TOOL CALL: Create comprehensive task breakdown
# TodoWrite: [
#   {"id": "1", "content": "Fetch and analyze target issue details", "status": "pending", "priority": "high"},
#   {"id": "2", "content": "Create feature branch with issue-based naming", "status": "pending", "priority": "high"},
#   {"id": "3", "content": "Analyze codebase for implementation requirements", "status": "pending", "priority": "high"},
#   {"id": "4", "content": "Identify security/performance considerations", "status": "pending", "priority": "high"},
#   {"id": "5", "content": "Create strategic implementation plan", "status": "pending", "priority": "medium"},
#   {"id": "6", "content": "Document testing and validation strategy", "status": "pending", "priority": "medium"},
#   {"id": "7", "content": "Create merge request with comprehensive plan", "status": "pending", "priority": "high"}
# ]
```

### 2. 🔍 Issue Deep Dive & Assignment

```bash
# TOOL CALL: Get detailed issue information
# gitlab_get_issue --project_id <project_id> --issue_iid <issue_number>

# TOOL CALL: Self-assign the issue (unless specified otherwise)
# gitlab_update_issue --project_id <project_id> --issue_iid <issue_number> --assignee_ids [<current_user_id>]
```

**Issue Analysis Checklist:**

- [ ] Understand the problem statement and requirements
- [ ] Identify acceptance criteria and implementation requirements
- [ ] Note any specific files or components mentioned
- [ ] Assess complexity and scope of changes needed
- [ ] Check for related issues or dependencies
- [ ] Understand priority level and urgency

### 3. 🌿 Branch Creation & Naming

```bash
# TOOL CALL: Mark branch creation task as in progress
# TodoWrite: [{"id": "2", "status": "in_progress", ...}]

# BASH: Create feature branch with consistent naming
ISSUE_NUMBER="<issue_number>"
ISSUE_TITLE_SLUG="<slugified-issue-title>"
BRANCH_NAME="${ISSUE_NUMBER}-${ISSUE_TITLE_SLUG}"

git checkout -b "$BRANCH_NAME"
echo "Created branch: $BRANCH_NAME"

# BASH: Verify branch creation
git branch --show-current
```

**Branch Naming Convention:**

- Format: `{issue_number}-{descriptive-slug}`
- Examples: `16-input-validation-size-limits`, `23-database-connection-pooling`
- Use kebab-case for readability
- Keep under 50 characters when possible

### 4. 🔍 Codebase Analysis & Requirement Discovery

```bash
# TOOL CALL: Comprehensive codebase analysis using Task tool
# Task --description "Analyze codebase for issue requirements" --prompt "
# Analyze the codebase to understand the implementation requirements for issue #<issue_number>.
#
# Focus on:
# 1. Project setup and build system (check CLAUDE.md for instructions)
# 2. Current implementation gaps related to the issue
# 3. Files and components that need modification
# 4. Security implications and vulnerabilities
# 5. Performance considerations
# 6. Testing requirements and existing test patterns
# 7. Project-specific build and quality processes
# 8. Code quality standards and tooling requirements
#
# Examine these specific areas mentioned in the issue:
# - <specific_files_from_issue>
# - <components_mentioned>
# - Project-specific considerations (read CLAUDE.md for build/test instructions)
#
# Return a comprehensive analysis including:
# - Project setup assessment (read CLAUDE.md for specifics)
# - Current state vs desired state analysis
# - Security/performance risks identified
# - Implementation complexity evaluation
# - Project-appropriate approach considerations
# - Testing strategy requirements (follow project conventions)
# - Build and deployment considerations (as documented in CLAUDE.md)
# "
```

**Analysis Documentation Requirements:**

- Document project setup and build system (reference CLAUDE.md)
- Document current state vs desired state
- Identify all affected files and components
- Note security implications and risk levels
- Assess performance impact and considerations
- Map out testing requirements and strategies (follow project conventions)
- Identify build system requirements and dependencies (per CLAUDE.md)
- Document code quality and formatting standards (per project)

### 5. 🎯 Strategic Implementation Planning

```bash
# TOOL CALL: Mark planning task as in progress
# TodoWrite: [{"id": "5", "status": "in_progress", ...}]

# Based on analysis, create strategic plan covering:
# - Implementation phases and priorities
# - Technical approach options and trade-offs
# - Security and performance considerations
# - Testing and validation strategies
# - Success metrics and acceptance criteria
```

**Strategic Planning Framework:**

#### Implementation Phases

- **Phase 1**: Foundation/Infrastructure setup
- **Phase 2**: Core functionality implementation
- **Phase 3**: Integration and validation
- **Phase 4**: Advanced features and optimization

#### Technical Considerations

- **Project Setup**: Build system and tooling requirements (per CLAUDE.md)
- **Architecture Impact**: How changes affect system design
- **Security Implications**: Threat model and vulnerability assessment
- **Performance Impact**: Resource usage and optimization needs
- **Compatibility**: Backwards compatibility and migration needs
- **Build System**: Integration with existing build and deployment processes
- **Dependencies**: New libraries or tools required

#### Success Metrics

- **Functional Requirements**: Core feature implementation
- **Quality Metrics**: Test coverage, performance benchmarks
- **Security Goals**: Vulnerability prevention, compliance
- **User Experience**: Error handling, documentation quality

### 6. 📝 Testing Strategy Development

```bash
# TOOL CALL: Define comprehensive testing approach
# Document testing requirements covering:
# - Project-specific testing frameworks and patterns (as documented in CLAUDE.md)
# - Unit testing for new functionality (using project conventions)
# - Integration testing for system interactions
# - Security testing for vulnerability prevention (if applicable to project)
# - Performance testing for resource impact (if configured in project)
# - Edge case and error condition testing
# - Build system integration and CI/CD pipeline testing (using CLAUDE.md commands)
#
# NOTE: All testing approaches must reference commands and patterns from CLAUDE.md
```

**Testing Strategy Components:**

#### Project-Specific Testing Requirements

- **Testing Setup**: Follow testing patterns documented in CLAUDE.md
- **Test Structure**: Conventional test organization for the project
- **Mock/Stub Strategies**: Project-appropriate mocking approaches
- **Test Data Management**: Project-specific test data handling

#### Test Categories Required

- **Unit Tests**: Individual function/component testing (per project conventions)
- **Integration Tests**: Inter-component interaction testing
- **Security Tests**: Attack vector and vulnerability testing
- **Performance Tests**: Load, stress, and benchmark testing (as configured)
- **Edge Case Tests**: Boundary conditions and error scenarios
- **Build Tests**: Verification using commands from CLAUDE.md

#### Test Coverage Goals

- Project-appropriate minimum coverage thresholds
- Critical path testing requirements
- Regression testing considerations
- Automated vs manual testing balance
- CI/CD pipeline integration requirements

### 7. 🚀 Merge Request Creation

Never mention that the Merge Request was co-authored or generated by Claude Code or any AI.

```bash
# BASH: Push feature branch to enable MR creation
git push -u origin "$BRANCH_NAME"

# TOOL CALL: Create strategic merge request
# gitlab_create_merge_request \
#   --project_id <project_id> \
#   --source_branch <branch_name> \
#   --target_branch main \
#   --title "<type>(<scope>): <description> - Issue #<issue_number>" \
#   --description "$(cat <<'EOF'
# ## <type>(<scope>): <description>
#
# Closes #<issue_number>
#
# ## 🎯 Issue Overview
# [Strategic problem statement and goals]
#
# ## 🔍 Analysis Summary
# [Key findings from codebase analysis]
#
# ## 🏗️ Implementation Strategy
# [High-level approach and phases]
#
# ## 🧪 Testing Strategy
# [Testing approach and coverage goals]
#
# ## 📊 Success Metrics
# [Measurable outcomes and acceptance criteria]
#
# ## 🔒 Security/Performance Considerations
# [Risk assessment and mitigation approach]
#
# ## 📋 Acceptance Criteria
# ### Must Have
# - [ ] [Core requirements]
#
# ### Should Have
# - [ ] [Important but not critical]
#
# ### Nice to Have
# - [ ] [Future enhancements]
#
# ---
# **Implementation approach and technical details are left to the development team's expertise and creativity.**
# EOF
# )"
```

**MR Title Format (Conventional Commits):**

Use format: `<type>(<scope>): <description> - Issue #<issue_number>`

Examples:
- `feat(validation): add input size limits - Issue #16`
- `fix(database): resolve connection timeout - Issue #23`
- `refactor(scheduler): improve task distribution - Issue #34`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**MR Description Template Structure:**

#### Strategic Sections (Required)

1. **Issue Overview**: Context and problem statement
2. **Analysis Summary**: Key findings and current state
3. **Implementation Strategy**: High-level approach and phases
4. **Testing Strategy**: Testing requirements and coverage
5. **Success Metrics**: Measurable outcomes
6. **Security/Performance**: Risk assessment and considerations
7. **Acceptance Criteria**: Must/Should/Nice-to-have requirements

#### Content Guidelines

- **Strategic, not prescriptive**: Focus on "what" and "why", not "how"
- **Analysis-driven**: Base recommendations on codebase analysis
- **Flexible implementation**: Leave technical creativity to implementers
- **Clear success criteria**: Define measurable outcomes
- **Risk-aware**: Address security and performance implications

### 8. 📊 Quality Assurance & Validation

```bash
# TOOL CALL: Final validation of merge request
# gitlab_get_merge_request --project_id <project_id> --merge_request_iid <mr_iid>

# TOOL CALL: Mark all tasks as completed
# TodoWrite: [all_tasks_with_completed_status]

# BASH: Final verification
echo "Merge Request Creation Complete:"
echo "✅ Issue analyzed and assigned"
echo "✅ Feature branch created and pushed"
echo "✅ Comprehensive codebase analysis completed"
echo "✅ Strategic implementation plan documented"
echo "✅ Testing strategy defined"
echo "✅ Merge request created with complete documentation"
echo "✅ Ready for implementation team review"
```

## Quality Standards

### Issue Analysis Quality

- [ ] **Complete understanding**: All requirements and constraints identified
- [ ] **Risk assessment**: Security and performance implications documented
- [ ] **Scope clarity**: Clear boundaries of what will/won't be implemented
- [ ] **Success criteria**: Measurable and testable outcomes defined

### Codebase Analysis Quality

- [ ] **Comprehensive coverage**: All relevant files and components examined
- [ ] **Current state documentation**: Existing implementation gaps identified
- [ ] **Impact assessment**: Changes' effects on system architecture understood
- [ ] **Testing landscape**: Existing test patterns and requirements mapped

### Strategic Planning Quality

- [ ] **Phase-based approach**: Logical implementation progression defined
- [ ] **Options consideration**: Multiple technical approaches evaluated
- [ ] **Risk mitigation**: Security and performance concerns addressed
- [ ] **Flexibility preservation**: Implementation creativity not constrained

### Documentation Quality

- [ ] **Strategic focus**: Emphasis on goals and outcomes, not implementation details
- [ ] **Clear communication**: Accessible to both technical and non-technical stakeholders
- [ ] **Actionable content**: Clear next steps and acceptance criteria
- [ ] **Professional presentation**: Well-structured and comprehensive

## Best Practices

### Issue Selection

- Prioritize security and critical functionality issues
- Consider implementation complexity vs business value
- Ensure issue description has sufficient detail for analysis
- Verify no duplicate or conflicting work is in progress

### Analysis Approach

- Use systematic codebase exploration tools
- Document findings as you discover them
- Consider cross-cutting concerns (security, performance, compatibility)
- Validate assumptions with existing code patterns

### Planning Strategy

- Think in phases to enable incremental delivery
- Consider multiple technical approaches and trade-offs
- Plan for testing and validation from the beginning
- Leave implementation creativity to the development team

### Communication

- Write for multiple audiences (developers, reviewers, stakeholders)
- Focus on strategic value and business outcomes
- Provide clear success criteria and acceptance tests
- Maintain professional and collaborative tone
- Never reveal AI assistance in any content creation

## Error Handling

### Common Issues & Recovery

#### 1. **Insufficient Issue Information**

```bash
# Recovery approach:
1. Comment on issue requesting clarification
2. Research related issues and documentation
3. Create draft MR with questions and assumptions
4. Tag issue author for feedback
```

#### 2. **Complex/Unclear Codebase**

```bash
# Recovery approach:
1. Use multiple analysis passes with different tools
2. Focus on entry points and main interfaces first
3. Document what you do understand
4. Note areas requiring implementer investigation
```

#### 3. **Conflicting Requirements**

```bash
# Recovery approach:
1. Document the conflicts clearly
2. Propose options with trade-offs
3. Recommend stakeholder discussion
4. Create MR highlighting decision points
```

#### 4. **Security/Performance Concerns**

```bash
# Recovery approach:
1. Err on the side of caution in recommendations
2. Clearly document risk areas
3. Suggest security review requirements
4. Recommend performance testing protocols
```

## Tools Reference

### Tool Usage Patterns

- **TodoWrite/TodoRead**: Task management and progress tracking throughout workflow
- **gitlab\_\***: GitLab API interactions for issue and MR management
- **Task**: Comprehensive codebase analysis when deep investigation needed
- **Read/Grep/Glob**: Targeted file and code examination
- **Bash**: Git operations, branch management, and standard development commands

### Analysis Tools Priority

1. **Task tool**: For comprehensive, multi-file analysis requiring deep investigation
2. **Grep/Glob**: For targeted searches and pattern identification
3. **Read**: For examining specific files and understanding context
4. **Bash**: For project structure exploration and git operations

---

This workflow ensures systematic, high-quality transformation of issues into actionable merge requests with comprehensive strategic documentation while preserving implementation flexibility for development teams.
