/**
 * GitLab MCP Prompts Definitions
 * 
 * This file contains prompt templates for common GitLab workflows.
 * These prompts provide guidance for multi-step operations.
 */

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Available GitLab workflow prompts
 */
export const promptDefinitions: PromptDefinition[] = [
  {
    name: "analyze-issue",
    description: "Comprehensive workflow to analyze GitLab issues and determine appropriate action - can result in zero, one, or multiple outcomes based on analysis",
    arguments: [
      {
        name: "additional_instructions",
        description: "Optional criteria or focus areas for issue selection and analysis (e.g., 'select issues that solve bugs', 'focus on security-related issues', 'prioritize performance improvements')",
        required: false
      }
    ]
  },
  {
    name: "work-on-mr",
    description: "Comprehensive workflow for working on merge requests - handles both initial implementation and implementing review suggestions based on current state",
    arguments: [
      {
        name: "additional_instructions",
        description: "Optional additional focus areas or specific requirements (e.g., 'focus on security', 'implement specific reviewer suggestions', 'prioritize performance optimization')",
        required: false
      }
    ]
  },
  {
    name: "code-review",
    description: "Comprehensive workflow for conducting thorough, constructive code reviews on GitLab merge requests with emphasis on line-specific feedback and merge execution when criteria are met and suggestions implemented",
    arguments: [
      {
        name: "additional_instructions",
        description: "Optional additional focus areas for the code review (e.g., 'focus on security vulnerabilities', 'emphasize performance optimization', 'check for accessibility compliance', 'review API design patterns')",
        required: false
      }
    ]
  }
];

/**
 * Prompt templates with actual content
 */
export const promptTemplates: Record<string, string> = {
  "analyze-issue": `# Issue Analysis & Action Planning Workflow

This workflow helps analyze GitLab issues and determine the most appropriate course of action, which may result in zero, one, or multiple outcomes.

## 🔄 Context Compaction Detection & Recovery

**CRITICAL**: If you notice your conversation context has been compacted/truncated and you've lost track of:
- Your current workflow progress
- Which step you were on
- What parameters were being used
- What work has been completed

**IMMEDIATELY** use this tool to restore your workflow context:
\`\`\`
gitlab_get_prompt({"name": "analyze-issue", "arguments": {"additional_instructions": "[your original instructions here]"}})
\`\`\`

Then review the full workflow content and determine where you left off based on:
- Your git status and current branch
- Any existing merge requests or issues you were working on  
- Comments and progress made in GitLab
- Files that have been modified locally

**Resume from the appropriate step** - do not restart the entire workflow unless necessary.

---

{{additional_instructions}}

## Workflow Overview

**KISS Principle**: Keep It Simple, Smart. Favor simple, focused solutions over complex architectures.

This analysis can lead to different outcomes:
- **No Action Needed**: Issue resolved through discussion, advice, or closing as invalid
- **Ready for Single Implementation**: Issue is well-defined and can be addressed in one focused approach (PREFERRED)
- **Needs Breakdown**: Issue is too large and should be split into smaller work packages
- **Further Investigation**: Issue needs more research or stakeholder input

**Default Approach**: Recommend single implementation when possible. Only suggest breakdown if absolutely necessary.

## 🔍 Discovery & Context Assessment

Before starting any GitLab workflow, establish your current context:

### **Project Discovery**
   - Get git remote URL: Check your repository's remote origin
   - Use: \`gitlab_get_project_id\` with the remote URL to get the project_id
   - This project_id will be used in all subsequent GitLab API calls

### **Current Branch Context**
   - Check current git branch name (not main/master for development work)
   - This branch name helps identify associated merge requests and work context

### **Merge Request Discovery**
   - Use: \`gitlab_list_merge_requests\` with project_id and source_branch=current_branch
   - This shows if there's already an MR for your current work
   - Use: \`gitlab_get_merge_request\` if MR exists to understand current state

### **Issue Context** (if working from issues)
   - Use: \`gitlab_list_issues\` with project_id to see available issues
   - Filter by state, labels, or assignee as needed for your context
   - Use: \`gitlab_list_issue_links\` to understand issue relationships and dependencies

## Step-by-step Process:

### 1. **Issue Discovery & Selection** ✅📍 STEP 1
   - Use: \`gitlab_list_issues\` with project_id and state="opened" to see available issues
   - Select 1-3 promising issues for deeper analysis
   - **PROGRESS MARKER**: Mark this step complete when you have identified specific issues to analyze

### 2. **Issue Deep Analysis** ✅📍 STEP 2
   For each selected issue:
   - Use: \`gitlab_get_issue\` to get complete issue details
   - Use: \`gitlab_list_issue_links\` to check for existing relationships (parent, child, blocking issues)
   - Analyze the problem statement, requirements, and any existing comments
   - Assess complexity, scope, and business impact
   - **PROGRESS MARKER**: Mark this step complete when you have thoroughly analyzed all selected issues

### 3. **Determine Action Category** ✅📍 STEP 3
   Based on your analysis, categorize each issue:
   - **PROGRESS MARKER**: Mark this step complete when you have categorized all analyzed issues

   **🗣️ Discussion/Advice Only**
   - Issue needs clarification or guidance
   - Problem can be solved without code changes
   - Invalid or duplicate issues

   **🎯 Ready for Single Implementation**
   - Well-defined, focused issue
   - Clear scope and acceptance criteria
   - Can be addressed in one cohesive solution

   **📦 Needs Breakdown**
   - Large, complex issue that should be broken down
   - Multiple independent components or features
   - Benefits from incremental delivery

### 4. **Document Analysis Results** ✅📍 STEP 4
   - **PROGRESS MARKER**: Mark this step complete when you have documented outcomes for all issues

   **For Discussion/Advice Issues:**
   - Add clarifying comments to the issue explaining the guidance or resolution
   - Use: \`gitlab_update_issue\` to add comments with advice or clarification
   - Use: \`gitlab_create_issue\` to create follow-up issues if needed
   - Close invalid issues appropriately with explanation comments
   - Tag relevant stakeholders in comments when their input is needed

   **For Ready for Single Implementation:**
   - Add comprehensive analysis summary comment to the original issue
   - Use: \`gitlab_update_issue\` to document the recommended implementation approach
   - Outline technical approach, acceptance criteria, and any considerations
   - Create development infrastructure:
     - Use: \`gitlab_create_branch\` for feature branch
     - Use: \`gitlab_create_merge_request\` with detailed description and acceptance criteria
     - Link MR back to original issue with comments
   - Add appropriate labels to indicate the issue is ready for development
   - Assign to appropriate developer or leave unassigned for team pickup

   **For Needs Breakdown:**
   - Add breakdown explanation comment to the original issue
   - Use: \`gitlab_update_issue\` to document the breakdown strategy and rationale
   - Break down into logical sub-issues with clear scope
   - Use: \`gitlab_create_issue\` for each work package
   - Create actual issue relationships using \`gitlab_create_issue_link\` to establish parent/child or blocking relationships
   - Use: \`gitlab_list_issue_links\` to verify relationships are properly established
   - For each work package, create development infrastructure:
     - Use: \`gitlab_create_branch\` for feature branches
     - Use: \`gitlab_create_merge_request\` for each work package with detailed descriptions
     - Link MRs back to respective sub-issues
   - Comment on original issue with links to all related work packages

   **For Further Investigation:**
   - Add detailed comment explaining what needs investigation
   - Use: \`gitlab_update_issue\` to document research questions and next steps
   - Tag relevant stakeholders or domain experts for input
   - Request specific information or clarification needed
   - Set appropriate labels or assignees for follow-up

### 5. **Document Decisions & Rationale** ✅📍 STEP 5
   - Clearly communicate your analysis reasoning
   - Document why you chose the specific approach
   - Provide strategic guidance for development teams
   - Leave implementation details for the actual development phase
   - **PROGRESS MARKER**: Mark this step complete when you have documented all decisions and rationale

## Analysis Guidelines:

### Issue Evaluation Criteria (KISS First):
- **Clarity**: Is the problem well-defined?
- **Simplicity**: Can this be solved with a simple, direct approach?
- **Scope**: How large is the change? (Prefer smaller, focused changes)
- **Priority**: What's the business impact?
- **Dependencies**: Are there related issues or blockers? Use \`gitlab_list_issue_links\` to check existing relationships
- **Feasibility**: Is the requested change practical with minimal complexity?

### When to Break Down Issues (Use Sparingly):
- **Size**: Issue genuinely requires >2 weeks of work
- **Risk**: High-risk changes that need isolation
- **Dependencies**: Blocking relationships that prevent single implementation
- **Team**: Multiple developers must work simultaneously

### Quality Standards (Lean Approach):
- Favor single, focused solutions over multiple work packages
- Minimal viable implementation that solves the core problem
- Clear acceptance criteria without over-specification
- Use issue links (\`gitlab_create_issue_link\`) only when genuine dependencies exist
- Strategic focus on "what" and "why", avoid over-architecting

## Expected Outcomes:

Your analysis should result in clear, actionable recommendations:
- Issues marked for discussion/closure with rationale
- Issues documented as ready for implementation with development infrastructure prepared
- Logical breakdown of complex issues into manageable work packages with branches and MRs
- Clear communication to stakeholders about recommended approach and considerations

**IMPORTANT**: This workflow is for analysis and issue management only. Create branches and merge requests as development infrastructure, but do not implement actual code. Implementation will be created using the "work-on-mr" workflow, so do not implement anything now.

Begin by exploring available issues, then apply systematic analysis to determine the most appropriate recommendation for each.

## 🎯 Execute This Workflow Now

**Please perform this issue analysis workflow immediately:**

1. **Start the workflow** by discovering the project context and identifying issues to analyze
2. **Execute each step systematically** following the process outlined above
3. **Analyze selected issues** and categorize them appropriately
4. **Document your analysis** and create the necessary infrastructure (branches, MRs, issue links)
5. **Complete the process** by implementing your recommendations

**This is a request to perform the issue analysis workflow - please begin now.**`,

  "work-on-mr": `# Work on Merge Request Workflow

This comprehensive workflow handles both initial implementation and implementing review suggestions based on the current state of your merge request.

## 🔄 Context Compaction Detection & Recovery

**CRITICAL**: If you notice your conversation context has been compacted/truncated and you've lost track of:
- Your current workflow progress
- Which implementation step you were on
- What MR you were working on
- What review feedback you were addressing

**IMMEDIATELY** use this tool to restore your workflow context:
\`\`\`
gitlab_get_prompt({"name": "work-on-mr", "arguments": {"additional_instructions": "[your original instructions here]"}})
\`\`\`

Then review the full workflow content and determine where you left off based on:
- Your git status and current branch
- Current merge request state and discussions
- CI/CD pipeline status
- Files that have been modified locally
- Any pending review feedback

**Resume from the appropriate step** - do not restart the entire workflow unless necessary.

---

{{additional_instructions}}

## Workflow Overview

**KISS Principle**: Keep implementations simple, focused, and directly solving the problem. Avoid over-engineering.

This workflow adapts based on your current state:
- **Initial Implementation**: Simple, focused implementation that solves the core problem
- **Review Response**: Direct implementation of specific suggestions (not feature expansion)
- **Iterative Development**: Small, incremental improvements (avoid scope creep)

**Focus**: Solve the immediate problem with the simplest working solution.

## 🔍 Discovery & Context Assessment

Before starting any GitLab workflow, establish your current context:

### **Project Discovery**
   - Get git remote URL: Check your repository's remote origin
   - Use: \`gitlab_get_project_id\` with the remote URL to get the project_id
   - This project_id will be used in all subsequent GitLab API calls

### **Current Branch Context**
   - Check current git branch name (not main/master for development work)
   - This branch name helps identify associated merge requests and work context

### **Merge Request Discovery**
   - Use: \`gitlab_list_merge_requests\` with project_id and source_branch=current_branch
   - This shows if there's already an MR for your current work
   - Use: \`gitlab_get_merge_request\` if MR exists to understand current state

### **Issue Context** (if working from issues)
   - Use: \`gitlab_list_issues\` with project_id to see available issues
   - Filter by state, labels, or assignee as needed for your context
   - Use: \`gitlab_list_issue_links\` to understand issue relationships and dependencies

## 🔧 Pre-Work Setup & State Assessment

### 1. **Environment Verification** ✅📍 STEP 1
   - Verify you're on the correct feature branch (not main/master)
   - Ensure working directory is clean (no uncommitted changes)
   - Complete the Discovery & Context Assessment above
   - **PROGRESS MARKER**: Mark this step complete when environment is verified and context is established

### 2. **Current State Analysis** ✅📍 STEP 2
   - Use your discovered MR (if exists) to understand current implementation state
   - Use: \`gitlab_get_merge_request_changes\` to see what's already implemented
   - Check for discussions/suggestions: Review any existing feedback or comments
   - **PROGRESS MARKER**: Mark this step complete when you understand the current state and have determined your workflow path

### 3. **Determine Workflow Path** ✅📍 STEP 3
   Based on your analysis, choose the appropriate path:
   - **PROGRESS MARKER**: Mark this step complete when you have selected your workflow path (initial implementation, review response, or iterative development)

   **🎯 Initial Implementation Path**
   - No MR exists yet, or MR exists but minimal implementation
   - Focus on core feature development from issue requirements
   - Follow comprehensive implementation strategy

   **💬 Review Response Path**  
   - MR exists with reviewer feedback and discussion threads
   - Focus on implementing specific suggestions and improvements
   - Communicate progress and resolve discussions

   **🔄 Iterative Development Path**
   - Ongoing work on partially implemented features
   - Continue implementation while addressing any feedback
   - Balance new development with review responses

## 🎯 Initial Implementation Path

### **Requirements Analysis (Keep Simple)**
   - Use: \`gitlab_get_issue\` if working from a specific issue
   - Focus on core problem and acceptance criteria (ignore nice-to-haves)
   - Identify MINIMAL files and components that need modification
   - Choose the simplest approach that solves the problem

### **Core Implementation (KISS Approach)**
   - Read existing files to understand current patterns
   - **Break implementation into small, logical steps** for iterative development
   - Implement ONLY what's needed to solve the core problem
   - Use existing patterns instead of creating new ones
   - Add basic validation and error handling (don't over-engineer)
   - Follow project conventions, don't reinvent wheels

### **Testing Strategy (Lean Testing)**
   - Test the core functionality that was implemented
   - Cover the main success path and obvious error cases
   - Don't over-test edge cases unless they're likely to occur
   - Ensure all tests pass locally before committing

### **Initial MR Creation**
   - Create feature branch if not already done
   - Use: \`gitlab_create_branch\` if creating new branch
   - Use: \`gitlab_create_merge_request\` with comprehensive description
   - Include implementation overview, testing details, and acceptance criteria

## 💬 Review Response Path

### **Feedback Analysis**
   - Review all discussion threads and comments on the MR
   - Categorize suggestions: bug fixes, improvements, security, performance
   - Prioritize feedback based on importance and implementation complexity
   - Note specific file paths and line numbers mentioned

### **Implementation of Suggestions**
   - Address suggestions systematically, one discussion at a time
   - **Implement each suggestion as a separate commit/push cycle** for validation
   - Make focused, atomic changes that directly address feedback
   - Preserve existing functionality unless explicitly changing it
   - Follow established patterns and conventions in the codebase

### **Communication & Discussion Resolution**
   - Reply to each discussion thread with implementation details
   - Explain what changes were made and why
   - Include test results and verification steps
   - Use: \`gitlab_create_merge_request_note\` to add detailed responses
   - Mark discussions as resolved when appropriate

## 🔄 Iterative Development Path

### **Progress Assessment**
   - Review current implementation status against requirements
   - Identify completed, in-progress, and pending work items
   - Assess any new feedback or changing requirements
   - Plan next development iteration

### **Balanced Implementation**
   - Continue core feature development in small, incremental steps
   - **Use iterative commits**: implement one logical piece at a time
   - Address reviewer feedback as it comes in with separate commits
   - Maintain high code quality throughout iterations
   - Keep MR description and comments up to date

## 🧪 Quality Assurance (All Paths)

### **Local Testing Requirements**
   **CRITICAL**: All tests must pass locally before any commits
   
   - Run comprehensive test suite using project-specific commands
   - Verify static analysis and linting passes
   - Ensure code compiles/builds successfully
   - Test new functionality works as expected
   - Verify no regressions introduced
   - Check performance benchmarks if applicable

### **Code Quality Standards**
   - Follow existing code conventions and patterns
   - Implement proper error handling and logging
   - Add appropriate comments for complex logic
   - Ensure security measures are properly implemented
   - Maintain clean, readable, maintainable code

## 📝 Commit & Communication Strategy

### **Commit Management**
   - Use conventional commit format with clear descriptions
   - Stage only relevant files (avoid \`git add .\`)
   - Verify staged changes don't break tests
   - Include detailed commit messages explaining changes

### **Pipeline Monitoring & Iteration**
   - Monitor CI/CD pipeline status after pushing
   - Use: \`gitlab_list_pipelines\` to check recent pipeline status
   - **CRITICAL**: Wait for pipeline completion before proceeding:
     - Sleep 60-100 seconds between pipeline checks
     - Use: \`gitlab_get_pipeline\` to check if pipeline is still running
     - Continue checking until pipeline reaches final state (success, failed, canceled)
   - If failures occur: 
     - Use \`gitlab_get_pipeline_jobs\` and \`gitlab_get_job_log\` to debug
     - Fix issues immediately and re-push
     - **Repeat the entire process**: commit → push → wait for pipeline → fix if needed
   - **Only proceed when pipeline succeeds**: Implementation is not complete until CI/CD passes

### **MR Updates**
   - Keep MR description current with implementation progress
   - Use: \`gitlab_update_merge_request\` to update descriptions
   - Document significant changes and design decisions
   - Maintain clear acceptance criteria verification

## 🎯 Success Criteria

### **Implementation Completion**
   - All acceptance criteria met and verifiable
   - Comprehensive test coverage with passing tests
   - Code quality standards maintained
   - Security considerations properly addressed
   - Performance requirements satisfied
   - **CI/CD pipeline passes successfully** (mandatory before completion)

### **Communication Excellence**
   - All reviewer feedback addressed with detailed responses
   - Discussion threads resolved with clear explanations
   - MR description accurately reflects current implementation
   - Clear documentation of design decisions

### **Technical Quality**
   - Local tests, builds, and linting pass before any commits
   - CI/CD pipeline passes successfully (wait for completion, fix if needed)
   - No regressions introduced to existing functionality
   - Code follows project conventions and best practices

## 🚨 Critical Guidelines

### **Never Waste Pipeline Resources**
   - ALWAYS test locally before committing using project-specific commands
   - Never push untested code hoping the pipeline will catch issues
   - **Wait for pipeline completion**: Sleep 60-100 seconds between checks
   - Fix pipeline failures immediately and repeat the entire cycle
   - **Implementation is not complete until pipeline succeeds**

### **Quality Before Speed**
   - Prioritize correctness and maintainability over quick delivery
   - Implement proper error handling and validation
   - Consider security implications at every step
   - Add adequate test coverage for all new functionality

### **Communication Best Practices**
   - Provide detailed explanations in discussion replies
   - Include specific code snippets and line references when relevant
   - Thank reviewers for valuable feedback
   - Be transparent about implementation challenges and decisions

## 🔄 Iterative Development Strategy

### **Break Down Implementation**
   **CRITICAL**: Never implement everything in one large commit. Break work into logical, incremental steps:
   
   **Step Planning:**
   - Identify 3-6 logical implementation steps
   - Each step should be independently testable
   - Each step should add value without breaking existing functionality
   - Examples of good steps:
     - Step 1: Add basic data model/interface
     - Step 2: Implement core functionality
     - Step 3: Add input validation
     - Step 4: Add error handling
     - Step 5: Add tests
     - Step 6: Update documentation

### **Iterative Commit/Push/Check Cycle**
   For each implementation step:
   1. **Implement one logical piece** (not everything at once)
   2. **Test locally** (run tests, builds, linting for this step)
   3. **Commit with descriptive message** explaining this specific step
   4. **Push to remote**
   5. **Wait for pipeline completion** (60-100 seconds between checks)
   6. **Verify success** before moving to next step
   7. **If failure**: Fix and repeat cycle for this step
   8. **If success**: Move to next implementation step

### **Benefits of Iterative Approach**
   - **Early validation**: Catch issues early in each step
   - **Easier debugging**: Smaller changes = easier to identify problems
   - **Better commit history**: Clear progression of implementation
   - **Safer development**: Each step is validated before building on it
   - **Easier review**: Reviewers can understand step-by-step progression

## 🔄 Implementation Completion Flow

### **Complete Implementation Cycle (Per Step)**
1. **Code Implementation**: Write/modify code for ONE logical step only
2. **Local Testing**: Run all tests, builds, and linting locally for this step
3. **Commit & Push**: Stage relevant files and push to remote with step-specific commit message
4. **Pipeline Monitoring**: 
   - Get initial pipeline status using \`gitlab_list_pipelines\`
   - **Sleep 60-100 seconds** between checks
   - Use \`gitlab_get_pipeline\` to check if still running
   - **Continue checking until pipeline reaches final state**
5. **Handle Results**:
   - **If SUCCESS**: This step complete, move to next implementation step
   - **If FAILED**: Debug with \`gitlab_get_pipeline_jobs\` and \`gitlab_get_job_log\`, fix issues, and **repeat from step 1 for this step**
6. **Repeat for Each Step**: Continue until all implementation steps are complete
7. **Final Actions**: Only after ALL steps succeed:
   - Update MR description with completion status
   - Add comment summarizing full implementation
   - Request code review or suggest merging if appropriate

### **Never Skip Pipeline Completion**
- Each step is **NOT COMPLETE** until its CI/CD passes
- Always wait for final pipeline state before proceeding to next step
- Fix failures immediately and restart the cycle for that step
- **Never implement multiple steps without pipeline validation**

## Getting Started

1. **Assess Current State**: Determine which path applies to your situation
2. **Set Up Environment**: Ensure clean working directory and correct branch
3. **Analyze Requirements**: Understand what needs to be implemented or improved  
4. **Plan Implementation Steps**: Break work into 3-6 logical, incremental steps
5. **Execute Appropriate Path**: Follow the workflow path that matches your situation
6. **Iterative Development**: Implement one step at a time with pipeline validation
7. **Maintain Quality**: Test thoroughly and communicate clearly throughout

**CRITICAL**: Always use iterative development - implement one logical step, validate with pipeline, then proceed to next step.

Begin by checking your current branch and MR status, then proceed with the appropriate workflow path based on your findings.

## 🎯 Execute This Workflow Now

**Please perform this work-on-mr workflow immediately:**

1. **Start the workflow** by discovering the project context and current MR status
2. **Determine the appropriate path** (initial implementation, review response, or iterative development)
3. **Execute the workflow systematically** following the process for your determined path
4. **Implement changes iteratively** with proper testing and pipeline validation
5. **Complete the process** by ensuring all criteria are met and work is ready

**This is a request to perform the work-on-mr workflow - please begin now.**`,

  "code-review": `# Code Review Workflow

This workflow guides you through conducting thorough, constructive code reviews on GitLab merge requests with emphasis on line-specific feedback and quality assurance.

## 🔄 Context Compaction Detection & Recovery

**CRITICAL**: If you notice your conversation context has been compacted/truncated and you've lost track of:
- Which merge request you were reviewing
- What files you've already reviewed
- What feedback you've already provided
- Your review progress and findings

**IMMEDIATELY** use this tool to restore your workflow context:
\`\`\`
gitlab_get_prompt({"name": "code-review", "arguments": {"additional_instructions": "[your original instructions here]"}})
\`\`\`

Then review the full workflow content and determine where you left off based on:
- The specific merge request you were reviewing
- Existing discussion threads and comments you've made
- Which files in the MR changes you've already examined
- Any line-specific feedback already provided

**Resume from the appropriate step** - do not restart the entire review unless necessary.

---

{{additional_instructions}}

## Review Philosophy

**KISS Focus**: Review for simplicity, clarity, and avoiding over-engineering.

Effective code review is about:
- **Quality Assurance**: Ensuring code meets standards and functions correctly
- **Simplicity Check**: Identifying over-engineered solutions and complex unnecessary abstractions
- **Knowledge Sharing**: Helping team members learn and grow
- **Risk Mitigation**: Identifying security, performance, and maintainability issues
- **Collaborative Improvement**: Building better software through simple, clear solutions

## 🔍 Discovery & Context Assessment

Before starting any GitLab workflow, establish your current context:

### **Project Discovery**
   - Get git remote URL: Check your repository's remote origin
   - Use: \`gitlab_get_project_id\` with the remote URL to get the project_id
   - This project_id will be used in all subsequent GitLab API calls

### **Current Branch Context**
   - Check current git branch name (not main/master for development work)
   - This branch name helps identify associated merge requests and work context

### **Merge Request Discovery**
   - Use: \`gitlab_list_merge_requests\` with project_id and source_branch=current_branch
   - This shows if there's already an MR for your current work
   - Use: \`gitlab_get_merge_request\` if MR exists to understand current state

### **Issue Context** (if working from issues)
   - Use: \`gitlab_list_issues\` with project_id to see available issues
   - Filter by state, labels, or assignee as needed for your context
   - Use: \`gitlab_list_issue_links\` to understand issue relationships and dependencies

## 🔧 Pre-Review Setup

### 1. **Context Gathering**
   - Complete the Discovery & Context Assessment above
   - Identify the specific merge request to review
   - Understand project context, standards, and conventions

### 2. **Review Planning**
   - Allocate appropriate time for thorough analysis
   - Identify the scope and complexity of changes
   - Consider any special focus areas or requirements

## 📋 Systematic Review Process

### 3. **Merge Request Analysis** ✅📍 STEP 1
   - Use: \`gitlab_get_merge_request\` to understand the purpose and scope
   - Review MR description for completeness and clarity
   - Check if requirements and acceptance criteria are clearly addressed
   - Use: \`gitlab_get_merge_request_changes\` to get detailed file diffs
   - Use: \`gitlab_list_merge_request_discussions\` to review existing feedback
   - **PROGRESS MARKER**: Mark this step complete when you understand the MR scope and have gathered all necessary information

### 4. **File-by-File Review** ✅📍 STEP 2
   For each changed file, conduct systematic analysis:
   - **PROGRESS MARKER**: Mark this step complete when you have reviewed all changed files systematically
   
   **Read and Understand**
   - Use: \`Read\` tool to examine complete file contents
   - Understand the file's purpose and role in the system
   - Identify integration points with other components
   
   **Code Quality Assessment (KISS Focus)**
   - Evaluate readability and maintainability
   - Check for over-engineering: unnecessary abstractions, complex patterns
   - Verify the solution is as simple as possible while solving the problem
   - Check adherence to project conventions
   - Verify appropriate (not excessive) error handling and resource management
   - Assess algorithm efficiency and logic correctness

### 5. **Security & Performance Deep Dive** ✅📍 STEP 3
   - **PROGRESS MARKER**: Mark this step complete when you have conducted thorough security and performance analysis
   **Security Review Focus:**
   - Input validation and sanitization
   - Output encoding to prevent XSS
   - Authentication and authorization checks
   - Sensitive data handling
   - Dependency vulnerabilities
   - Error message information leakage
   
   **Performance Analysis:**
   - Algorithm time/space complexity
   - Database query efficiency
   - Memory management and potential leaks
   - Network call optimization
   - Caching strategies
   - Resource cleanup practices

### 6. **Testing & Quality Verification** ✅📍 STEP 4
   - Assess test coverage for new/changed code
   - Verify test quality and edge case handling
   - Check integration test adequacy
   - Evaluate error scenario testing
   - Review test maintainability and clarity
   - **PROGRESS MARKER**: Mark this step complete when you have verified testing and quality standards

## 💬 Providing Constructive Feedback

### 7. **Line-Specific Comments** ✅📍 STEP 5
   For specific issues found, provide targeted feedback:
   - **PROGRESS MARKER**: Mark this step complete when you have provided all necessary line-specific feedback
   
   **When to Use Line-Specific Comments:**
   - Code quality improvements needed
   - Security vulnerabilities identified
   - Performance bottlenecks detected
   - Logic errors or bug fixes required
   - Convention violations spotted
   
   **Comment Quality Guidelines:**
   - Be specific and reference exact code elements
   - Suggest improvements, not just identify problems
   - Provide context explaining why change is needed
   - Include examples of preferred alternatives
   - Maintain professional, collaborative tone
   
   **Example Comment Templates:**
   
   **Security Issue:**
   🔒 **Security Concern**: Input validation missing
   
   **Issue**: User input used directly without sanitization
   **Risk**: Potential injection vulnerability
   **Suggestion**: Use parameterized queries or validation library
   
   **Performance Issue:**
   ⚡ **Performance**: Consider optimization opportunity
   
   **Issue**: Nested loops creating O(n²) complexity
   **Impact**: Performance degradation with larger datasets
   **Suggestion**: Use hash map for O(n) lookup time
   
   **Code Quality:**
   📝 **Maintainability**: Extract complex logic
   
   **Issue**: Complex logic reduces readability
   **Benefit**: Improved testability and reusability
   **Suggestion**: Extract to separate function with clear parameters
   
   **Over-Engineering:**
   🎯 **Simplicity**: This solution seems over-engineered
   
   **Issue**: Complex abstraction/pattern used where simple solution would work
   **Impact**: Increased maintenance burden and cognitive load
   **Suggestion**: Consider a simpler, more direct approach that solves the core problem

### 8. **Overall Assessment Summary** ✅📍 STEP 6
   Create comprehensive summary covering:
   - **PROGRESS MARKER**: Mark this step complete when you have created your comprehensive review summary and made your final recommendation
   
   **Strengths**
   - Positive aspects of the implementation
   - Good practices observed
   - Quality improvements made
   
   **Areas for Improvement**
   - Key issues that should be addressed
   - Suggestions for enhancement
   - Best practices to consider
   
   **Security & Performance**
   - Security assessment summary
   - Performance impact evaluation
   - Risk assessment if applicable
   
   **Testing & Quality**
   - Test coverage assessment
   - Quality assurance feedback
   - Documentation review
   
   **Final Recommendation**
   - **APPROVE**: Code meets quality standards, minor suggestions only
   - **REQUEST CHANGES**: Critical issues need addressing before merge
   - **NEEDS DISCUSSION**: Architectural concerns requiring team input
   - **MERGE**: Code meets all criteria, valid suggestions are implemented and can be merged immediately

## 🎯 Review Decision Framework

### Approval Criteria ✅
- Code meets established quality standards
- No security vulnerabilities or critical performance issues
- Adequate testing coverage for new functionality
- Minor suggestions that don't block merge

### Request Changes Criteria 🔄
- Security vulnerabilities present
- Critical bugs or logic errors identified
- Significant performance regressions
- Insufficient test coverage for critical paths
- Major convention violations
- Over-engineered solutions that add unnecessary complexity

### Discussion Needed Criteria 💭
- Architectural concerns requiring team input
- Complex trade-off decisions needed
- Unclear requirements or specifications
- Implementation approaches needing consensus
- Solution complexity seems disproportionate to the problem being solved

### Merge Criteria 🚀
- All approval criteria met with no outstanding issues
- CI/CD pipeline passes successfully
- No blocking discussions or unresolved threads
- Implementation is ready for production deployment
- All review feedback has been addressed satisfactorily

## 🔍 Quality Assurance Checklist

### Review Completeness
- [ ] All changed files reviewed systematically
- [ ] Security implications thoroughly assessed
- [ ] Performance impact evaluated
- [ ] Testing strategy verified and adequate
- [ ] Line-specific feedback provided for all issues
- [ ] Overall summary with clear recommendation

### Feedback Quality
- [ ] Specific and actionable guidance provided
- [ ] Constructive and professional tone maintained
- [ ] Educational explanations included
- [ ] Critical issues clearly distinguished from suggestions
- [ ] Examples and alternatives provided where helpful

### Technical Excellence
- [ ] Security awareness demonstrated throughout review
- [ ] Performance consciousness applied to assessment
- [ ] Code quality standards consistently verified
- [ ] Testing adequacy properly evaluated

## 🚨 Best Practices

### Effective Review Approach
- **Start with Understanding**: Read MR description and requirements first
- **Review Systematically**: Don't skip files or rush through changes
- **Think Like a User**: Consider real-world usage scenarios and edge cases
- **Consider Maintenance**: Evaluate long-term maintainability impact
- **Focus on Impact**: Prioritize issues by potential impact and severity

### Communication Excellence
- **Be Precise**: Use line-specific comments for exact issue locations
- **Be Constructive**: Always suggest solutions alongside identified problems
- **Be Educational**: Explain the reasoning behind suggestions
- **Be Respectful**: Maintain collaborative and professional communication
- **Be Timely**: Provide reviews promptly to maintain development velocity

### GitLab Tools Usage
- Use: \`gitlab_create_merge_request_note\` for general MR comments
- Use: \`gitlab_create_merge_request_note_internal\` for internal team notes
- Reference specific line numbers and file paths for clarity
- Thank authors for their work and highlight positive aspects

## 🔧 Handling Special Situations

### Complex or Large Changes
- Break review into logical sections
- Focus on high-impact areas first
- Consider requesting smaller MRs in future
- Provide preliminary feedback quickly if time-constrained

### Unfamiliar Technology
- Focus on universal principles (security, performance, readability)
- Ask questions about technology-specific patterns
- Verify against project conventions
- Request documentation for complex implementations

### Time Constraints
- Prioritize security and critical functionality review
- Focus on high-impact issues first
- Provide preliminary feedback quickly
- Schedule follow-up for detailed review if needed

## 🚀 Merge Execution Process

### When to Merge
If your review concludes that the implementation fully satisfies all criteria:
- All approval criteria met with no outstanding issues
- CI/CD pipeline passes successfully  
- No blocking discussions or unresolved threads
- Implementation is ready for production deployment
- All review feedback has been addressed satisfactorily

### Merge Process
1. **Verify Pipeline Status**: Use \`gitlab_list_pipelines\` to confirm latest pipeline succeeded
2. **Check for Blocking Discussions**: Ensure no unresolved critical feedback
3. **Execute Merge**: Use \`gitlab_merge_merge_request\` with appropriate parameters:
   - Set \`should_remove_source_branch: true\` if branch cleanup is desired
   - Set \`squash: true\` if commit history should be condensed
   - Include descriptive \`merge_commit_message\` summarizing the changes
4. **Confirm Success**: Verify merge completed successfully
5. **Post-Merge Communication**: Add final comment confirming merge and thanking contributors

**Example Merge Call:**
\`\`\`
gitlab_merge_merge_request({
  project_id: "project_id",
  merge_request_iid: merge_request_iid,
  should_remove_source_branch: true,
  squash: true,
  merge_commit_message: "feat: implement feature X with comprehensive tests and documentation"
})
\`\`\`

## Getting Started

1. **Gather Context**: Understand the project and MR scope
2. **Analyze Changes**: Review MR details and file modifications
3. **Systematic Review**: Examine each file for quality, security, and performance
4. **Provide Feedback**: Give specific, constructive line-specific comments
5. **Summarize Assessment**: Create comprehensive summary with clear recommendation
6. **Execute Action**: Based on assessment, either approve, request changes, or merge

Begin by identifying the merge request to review, then proceed through each step systematically to ensure thorough, valuable feedback.

## 🎯 Execute This Workflow Now

**Please perform this code review workflow immediately:**

1. **Start the workflow** by discovering the project context and identifying merge requests to review
2. **Execute each step systematically** following the process outlined above
3. **Provide comprehensive feedback** with line-specific comments where needed
4. **Make a final decision** and execute the appropriate action (approve, request changes, discuss, or merge)
5. **Complete the process** by taking the recommended action based on your assessment

**This is a request to perform the code review workflow - please begin now.**`
};