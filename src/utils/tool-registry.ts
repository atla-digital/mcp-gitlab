/**
 * Tool registry - maps tool names to handler functions
 */

import { ToolRegistry } from "./handler-types.js";

// Import organized handlers
import { repositoryHandlers, mergeRequestHandlers, issueHandlers } from "../tools/handlers/index.js";

// Import legacy handlers (to be migrated)
import * as integrationHandlers from "../handlers/integration-handlers.js";
import * as cicdHandlers from "../handlers/cicd-handlers.js";
import * as usersGroupsHandlers from "../handlers/users-groups-handlers.js";

/**
 * Registry of all available tools mapped to their handler functions
 */
export const toolRegistry: ToolRegistry = {
  // Repository tools
  gitlab_list_projects: repositoryHandlers.listProjects,
  gitlab_get_project: repositoryHandlers.getProject,
  gitlab_list_branches: repositoryHandlers.listBranches,
  gitlab_get_repository_file: repositoryHandlers.getRepositoryFile,
  gitlab_compare_branches: repositoryHandlers.compareBranches,
  gitlab_get_project_id: repositoryHandlers.getProjectId,
  gitlab_create_branch: repositoryHandlers.createBranch,
  gitlab_delete_branch: repositoryHandlers.deleteBranch,

  // Merge request tools
  gitlab_list_merge_requests: mergeRequestHandlers.listMergeRequests,
  gitlab_get_merge_request: mergeRequestHandlers.getMergeRequest,
  gitlab_get_merge_request_changes: mergeRequestHandlers.getMergeRequestChanges,
  gitlab_create_merge_request: mergeRequestHandlers.createMergeRequest,
  gitlab_create_merge_request_note: mergeRequestHandlers.createMergeRequestNote,
  gitlab_create_merge_request_note_internal: mergeRequestHandlers.createMergeRequestNoteInternal,
  gitlab_list_merge_request_discussions: mergeRequestHandlers.listMergeRequestDiscussions,
  gitlab_get_merge_request_discussion: mergeRequestHandlers.getMergeRequestDiscussion,
  gitlab_create_merge_request_discussion: mergeRequestHandlers.createMergeRequestDiscussion,
  gitlab_reply_to_discussion: mergeRequestHandlers.replyToDiscussion,
  gitlab_resolve_discussion: mergeRequestHandlers.resolveDiscussion,
  gitlab_update_merge_request: mergeRequestHandlers.updateMergeRequest,
  gitlab_mark_merge_request_ready: mergeRequestHandlers.markMergeRequestReady,
  gitlab_merge_merge_request: mergeRequestHandlers.mergeMergeRequest,

  // Issue tools
  gitlab_list_issues: issueHandlers.listIssues,
  gitlab_create_issue: issueHandlers.createIssue,
  gitlab_get_issue: issueHandlers.getIssue,
  gitlab_update_issue: issueHandlers.updateIssue,

  // Integration tools
  gitlab_list_integrations: integrationHandlers.listIntegrations,
  gitlab_get_integration: integrationHandlers.getIntegration,
  gitlab_update_slack_integration: integrationHandlers.updateSlackIntegration,
  gitlab_disable_slack_integration: integrationHandlers.disableSlackIntegration,
  gitlab_list_webhooks: integrationHandlers.listWebhooks,
  gitlab_get_webhook: integrationHandlers.getWebhook,
  gitlab_add_webhook: integrationHandlers.addWebhook,
  gitlab_update_webhook: integrationHandlers.updateWebhook,
  gitlab_delete_webhook: integrationHandlers.deleteWebhook,
  gitlab_test_webhook: integrationHandlers.testWebhook,

  // CI/CD tools
  gitlab_list_pipelines: cicdHandlers.listPipelines,
  gitlab_get_pipeline: cicdHandlers.getPipeline,
  gitlab_get_pipeline_jobs: cicdHandlers.getPipelineJobs,
  gitlab_get_job_log: cicdHandlers.getJobLog,
  gitlab_retry_job: cicdHandlers.retryJob,
  gitlab_list_trigger_tokens: cicdHandlers.listTriggerTokens,
  gitlab_get_trigger_token: cicdHandlers.getTriggerToken,
  gitlab_create_trigger_token: cicdHandlers.createTriggerToken,
  gitlab_update_trigger_token: cicdHandlers.updateTriggerToken,
  gitlab_delete_trigger_token: cicdHandlers.deleteTriggerToken,
  gitlab_trigger_pipeline: cicdHandlers.triggerPipeline,
  gitlab_list_cicd_variables: cicdHandlers.listCiCdVariables,
  gitlab_get_cicd_variable: cicdHandlers.getCiCdVariable,
  gitlab_create_cicd_variable: cicdHandlers.createCiCdVariable,
  gitlab_update_cicd_variable: cicdHandlers.updateCiCdVariable,
  gitlab_delete_cicd_variable: cicdHandlers.deleteCiCdVariable,

  // Users and Groups tools
  gitlab_list_users: usersGroupsHandlers.listUsers,
  gitlab_get_current_user: usersGroupsHandlers.getCurrentUser,
  gitlab_get_user: usersGroupsHandlers.getUser,
  gitlab_list_groups: usersGroupsHandlers.listGroups,
  gitlab_get_group: usersGroupsHandlers.getGroup,
  gitlab_list_group_members: usersGroupsHandlers.listGroupMembers,
  gitlab_add_group_member: usersGroupsHandlers.addGroupMember,
  gitlab_list_project_members: usersGroupsHandlers.listProjectMembers,
  gitlab_add_project_member: usersGroupsHandlers.addProjectMember
}; 