# Workflow: Code Review

This document outlines the standardized workflow for conducting thorough, constructive code reviews on GitLab merge requests with emphasis on line-specific comments for maximum clarity and context.

**🔧 TECHNOLOGY-AGNOSTIC WORKFLOW**: This workflow does not assume any specific programming language, framework, or build system. All project-specific commands and requirements must be documented in the project's CLAUDE.md file.

## Prerequisites

- Access to GitLab MCP tools for merge request management
- Understanding of code quality principles and security best practices
- Knowledge of project architecture and coding standards
- **CLAUDE.md file containing project-specific build, test, and quality commands**

**IMPORTANT**: This workflow is technology-agnostic. All project-specific commands (build, test, lint) must be documented in CLAUDE.md.

## Workflow Steps

### 0. 🔧 Initial Setup & Context

```bash
# BASH: Get project information from git remote
REMOTE_URL=$(git remote get-url origin)
echo "Reviewing code for repository: $REMOTE_URL"

# TOOL CALL: Get project ID from remote URL
# gitlab_get_project_id --remote_url $REMOTE_URL
```

**Setup Verification Checklist:**

- [ ] GitLab project ID successfully retrieved
- [ ] Access to merge request under review confirmed
- [ ] Understanding of project context and standards
- [ ] Review time allocated appropriately for thorough analysis

### 1. 📋 Review Planning & Setup

```bash
# TOOL CALL: Create comprehensive review task breakdown
# TodoWrite: [
#   {"id": "1", "content": "Fetch and analyze merge request details", "status": "pending", "priority": "high"},
#   {"id": "2", "content": "Review all changed files systematically", "status": "pending", "priority": "high"},
#   {"id": "3", "content": "Check code quality and conventions", "status": "pending", "priority": "high"},
#   {"id": "4", "content": "Verify security and performance considerations", "status": "pending", "priority": "high"},
#   {"id": "5", "content": "Test functionality and edge cases", "status": "pending", "priority": "high"},
#   {"id": "6", "content": "Provide line-specific constructive feedback", "status": "pending", "priority": "medium"},
#   {"id": "7", "content": "Create summary and recommendations", "status": "pending", "priority": "medium"}
# ]
```

### 2. 🔍 Merge Request Analysis

```bash
# TOOL CALL: Get comprehensive MR information
# gitlab_get_merge_request --project_id <project_id> --merge_request_iid <mr_iid>

# TOOL CALL: Get detailed changes and diffs
# gitlab_get_merge_request_changes --project_id <project_id> --merge_request_iid <mr_iid>

# TOOL CALL: Review existing discussions
# gitlab_list_merge_request_discussions --project_id <project_id> --merge_request_iid <mr_iid>
```

**Analysis Checklist:**

- [ ] Understand the purpose and scope of changes
- [ ] Review MR description for completeness
- [ ] Check if requirements are clearly addressed
- [ ] Assess complexity and impact of changes
- [ ] Note any existing discussion points

### 3. 📁 Systematic File Review

```bash
# TOOL CALL: Read each changed file for comprehensive understanding
# For each file in the MR changes:
# Read --file_path <changed_file_path>

# BASH: Organize review by file categories
echo "Categorizing changed files for systematic review..."

# Example categorization (adapt to project structure):
# - Core logic files
# - Configuration files  
# - Test files
# - Documentation files
# - Build/deployment files
```

**File Review Process:**

#### For Each Changed File:

1. **Context Understanding**
   - [ ] Purpose and role in the system
   - [ ] Integration points with other components
   - [ ] Critical functionality impact

2. **Code Quality Assessment**
   - [ ] Readability and maintainability
   - [ ] Adherence to project conventions
   - [ ] Proper error handling
   - [ ] Resource management

3. **Logic Verification**
   - [ ] Correctness of implementation
   - [ ] Edge case handling
   - [ ] Algorithm efficiency
   - [ ] Data flow integrity

### 4. 🔒 Security & Performance Review

```bash
# BASH: Security-focused analysis
echo "Conducting security review..."

# Look for common security issues:
# - Input validation gaps
# - SQL injection vulnerabilities  
# - XSS attack vectors
# - Authentication/authorization bypasses
# - Sensitive data exposure
# - Insecure defaults

# BASH: Performance analysis
echo "Analyzing performance implications..."

# Check for performance concerns:
# - Inefficient algorithms
# - Database N+1 queries
# - Memory leaks
# - Resource contention
# - Unnecessary network calls
```

**Security Review Checklist:**

- [ ] **Input Validation**: All user inputs properly sanitized
- [ ] **Output Encoding**: Prevent XSS and injection attacks
- [ ] **Authentication**: No bypass of auth mechanisms
- [ ] **Authorization**: Proper permission checks
- [ ] **Data Protection**: Sensitive data properly handled
- [ ] **Error Handling**: No information leakage in errors
- [ ] **Dependencies**: No vulnerable libraries introduced

**Performance Review Checklist:**

- [ ] **Algorithm Efficiency**: Optimal time/space complexity
- [ ] **Database Operations**: Efficient queries and indexes
- [ ] **Memory Management**: No leaks or excessive allocation
- [ ] **Network Usage**: Minimal and efficient API calls
- [ ] **Caching Strategy**: Appropriate use of caching
- [ ] **Resource Cleanup**: Proper cleanup of resources

### 5. 🧪 Functionality Testing

```bash
# BASH: Read project-specific commands from CLAUDE.md
echo "Reading test commands from CLAUDE.md..."

if [[ ! -f "CLAUDE.md" ]]; then
    echo "⚠️  CLAUDE.md file not found - cannot verify testing approach"
    echo "Review should include manual verification of testing strategy"
else
    # Extract test commands for verification
    TEST_CMD=$(grep -E "^\s*[-*]\s*\`.*test.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
    BUILD_CMD=$(grep -E "^\s*[-*]\s*\`.*build.*\`" CLAUDE.md | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
    
    echo "Project test command: $TEST_CMD"
    echo "Project build command: $BUILD_CMD"
fi

# Verify testing strategy in the MR
echo "Reviewing testing approach..."
```

**Testing Review Areas:**

- [ ] **Test Coverage**: Adequate coverage for new/changed code
- [ ] **Test Quality**: Tests verify correct behavior
- [ ] **Edge Cases**: Boundary conditions tested
- [ ] **Integration Tests**: Component interactions verified
- [ ] **Error Scenarios**: Failure modes properly tested
- [ ] **Test Maintainability**: Tests are clear and maintainable

### 6. 💬 Line-Specific Feedback Creation

Never mention that feedback was generated by AI.

```bash
# TOOL CALL: Create targeted line-specific discussions for issues found
# gitlab_create_merge_request_discussion \
#   --project_id <project_id> \
#   --merge_request_iid <mr_iid> \
#   --body "<constructive_feedback_message>" \
#   --position {
#     "base_sha": "<base_sha_from_mr>",
#     "head_sha": "<head_sha_from_mr>", 
#     "start_sha": "<start_sha_from_mr>",
#     "old_path": "<file_path>",
#     "new_path": "<file_path>",
#     "position_type": "text",
#     "new_line": <line_number>,
#     "old_line": null
#   }
```

**Line-Specific Comment Guidelines:**

#### When to Use Line-Specific Comments:

- **Code Quality Issues**: Specific improvements for readability/maintainability
- **Security Vulnerabilities**: Exact locations of security concerns
- **Performance Problems**: Specific inefficient code sections
- **Logic Errors**: Precise algorithmic or business logic issues
- **Convention Violations**: Exact deviations from coding standards
- **Bug Fixes**: Specific corrections needed

#### Comment Quality Standards:

1. **Be Specific**: Reference exact code elements
2. **Be Constructive**: Suggest improvements, not just problems
3. **Provide Context**: Explain why the change is needed
4. **Include Examples**: Show preferred alternatives when possible
5. **Be Respectful**: Maintain professional, collaborative tone

#### Example Comment Templates:

**Security Issue:**
```
🔒 **Security Concern**: This input is not properly validated.

**Issue**: User input is directly used in database query without sanitization.
**Risk**: SQL injection vulnerability
**Suggestion**: Use parameterized queries or input validation library.

Example:
```sql
-- Instead of: query = "SELECT * FROM users WHERE id = " + userInput
-- Use: query = "SELECT * FROM users WHERE id = ?" with prepared statements
```

**Performance Issue:**
```
⚡ **Performance Optimization**: This loop could be optimized.

**Issue**: O(n²) complexity due to nested iteration
**Impact**: Performance will degrade significantly with larger datasets
**Suggestion**: Consider using a hash map for O(n) lookup time.

Example:
```
// Create lookup map outside the loop
const lookup = new Map(items.map(item => [item.id, item]));
// Then use: lookup.get(targetId) instead of items.find()
```

**Code Quality:**
```
📝 **Code Quality**: Consider extracting this logic into a separate function.

**Issue**: Complex logic embedded in larger function reduces readability
**Benefit**: Improved testability and reusability
**Suggestion**: Extract to `<suggested_function_name>()` with clear parameters.
```

### 7. 📊 Overall Assessment & Summary

```bash
# TOOL CALL: Create comprehensive summary comment
# gitlab_create_merge_request_note \
#   --project_id <project_id> \
#   --merge_request_iid <mr_iid> \
#   --body "$(cat <<'EOF'
# ## 🔍 Code Review Summary
# 
# ### Overall Assessment
# [High-level evaluation of the changes]
# 
# ### Strengths
# - [Positive aspects of the implementation]
# - [Good practices observed]
# - [Quality improvements made]
# 
# ### Areas for Improvement
# - [Key issues that should be addressed]
# - [Suggestions for enhancement]
# - [Best practices to consider]
# 
# ### Security & Performance
# - [Security assessment summary]
# - [Performance impact evaluation]
# - [Risk assessment if applicable]
# 
# ### Testing & Quality
# - [Test coverage assessment]
# - [Quality assurance feedback]
# - [Documentation review]
# 
# ### Recommendation
# **[APPROVE/REQUEST_CHANGES/NEEDS_DISCUSSION]**
# 
# [Final recommendation with reasoning]
# 
# ---
# *Review completed with focus on code quality, security, and maintainability*
# EOF
# )"
```

**Summary Assessment Categories:**

#### Approval Criteria:
- **✅ APPROVE**: 
  - Code meets quality standards
  - No security or critical performance issues
  - Adequate testing coverage
  - Minor suggestions only

#### Change Request Criteria:
- **🔄 REQUEST CHANGES**:
  - Security vulnerabilities present
  - Critical bugs or logic errors
  - Significant performance issues
  - Insufficient test coverage for critical paths

#### Discussion Criteria:
- **💭 NEEDS DISCUSSION**:
  - Architectural concerns requiring team input
  - Trade-off decisions needed
  - Unclear requirements or specifications
  - Complex implementation approaches

### 8. 📋 Review Quality Verification

```bash
# TOOL CALL: Verify all feedback has been provided
# gitlab_list_merge_request_discussions --project_id <project_id> --merge_request_iid <mr_iid>

# TOOL CALL: Mark review tasks as completed
# TodoWrite: [all_tasks_with_completed_status]

# BASH: Review completion checklist
echo "Review Quality Verification:"
echo "✅ All changed files reviewed systematically"
echo "✅ Security implications assessed"
echo "✅ Performance impact evaluated" 
echo "✅ Testing strategy verified"
echo "✅ Line-specific feedback provided for issues"
echo "✅ Overall summary and recommendation given"
echo "✅ Professional and constructive tone maintained"
```

## Quality Standards

### Review Thoroughness

- [ ] **Complete Coverage**: All changed files reviewed
- [ ] **Systematic Approach**: Organized review process followed
- [ ] **Multiple Perspectives**: Code quality, security, performance, and maintainability considered
- [ ] **Context Awareness**: Understanding of broader system impact

### Feedback Quality

- [ ] **Specific and Actionable**: Clear guidance for improvements
- [ ] **Constructive Tone**: Professional and collaborative communication
- [ ] **Educational Value**: Explanations help developer learning
- [ ] **Prioritized Issues**: Critical issues clearly distinguished from suggestions

### Technical Excellence

- [ ] **Security Awareness**: Security implications thoroughly considered
- [ ] **Performance Consciousness**: Performance impact evaluated
- [ ] **Code Quality Standards**: Adherence to best practices verified
- [ ] **Testing Adequacy**: Test coverage and quality assessed

## Best Practices

### Review Approach

- **Start with Understanding**: Read MR description and requirements first
- **Review Systematically**: Don't skip files or rush through changes
- **Think Like a User**: Consider real-world usage scenarios
- **Consider Maintenance**: Evaluate long-term maintainability
- **Focus on Impact**: Prioritize issues by their potential impact

### Communication Excellence

- **Be Specific**: Use line-specific comments for precise feedback
- **Be Constructive**: Suggest solutions, not just problems
- **Be Educational**: Explain the "why" behind suggestions
- **Be Respectful**: Maintain collaborative and professional tone
- **Be Timely**: Provide reviews promptly to maintain development velocity

### Line-Specific Commenting Strategy

- **Target Precision**: Comment exactly where the issue occurs
- **Provide Context**: Explain why the specific line/section needs attention
- **Suggest Alternatives**: Show better approaches when possible
- **Link Related Issues**: Connect related problems across different lines
- **Use Appropriate Tone**: Match urgency to severity of issue

## Error Handling

### Common Review Challenges

#### 1. **Unclear Requirements**
```bash
# When MR purpose is unclear:
1. Ask clarifying questions in general MR comment
2. Request better MR description
3. Tag relevant stakeholders for context
4. Focus review on code quality aspects that are clear
```

#### 2. **Complex Changes**
```bash
# For large or complex MRs:
1. Break review into logical sections
2. Focus on high-impact areas first
3. Request smaller MRs in future
4. Consider pair review for complex sections
```

#### 3. **Unfamiliar Technology**
```bash
# When reviewing unfamiliar code:
1. Focus on universal principles (security, performance, readability)
2. Ask questions about technology-specific patterns
3. Verify against project conventions in CLAUDE.md
4. Request documentation for complex implementations
```

#### 4. **Time Constraints**
```bash
# For urgent reviews:
1. Prioritize security and critical functionality
2. Focus on high-impact issues first
3. Provide preliminary feedback quickly
4. Schedule follow-up for detailed review
```

### Recovery Strategies

- **Missed Issues**: Acknowledge and provide follow-up feedback
- **Unclear Feedback**: Clarify with additional comments or discussion
- **Overly Critical**: Balance with positive observations
- **Too Permissive**: Follow up with additional quality suggestions

## Tools Reference

### GitLab MCP Tools Used

- `gitlab_get_project_id`: Extract project ID from git remote
- `gitlab_get_merge_request`: Fetch detailed MR information
- `gitlab_get_merge_request_changes`: Get file diffs and changes
- `gitlab_list_merge_request_discussions`: Review existing feedback
- `gitlab_create_merge_request_discussion`: Add line-specific comments
- `gitlab_create_merge_request_note`: Add general MR comments

### File Analysis Tools

- `Read`: Examine file contents for detailed analysis
- `Grep`: Search for patterns and potential issues
- `Glob`: Find related files for context

### Development Tools

- `TodoWrite/TodoRead`: Track review progress and completeness
- `Bash`: Execute analysis commands and verification steps

---

This workflow ensures systematic, high-quality code reviews with precise, constructive feedback that helps maintain code excellence and supports developer growth.