/**
 * Tool registry - maps tool names to handler functions
 */

import { ToolRegistry } from "./handler-types.js";

// Import repository handlers
import * as repoHandlers from "../handlers/repository-handlers.js";

// Import integration handlers
import * as integrationHandlers from "../handlers/integration-handlers.js";

// Import CI/CD handlers
import * as cicdHandlers from "../handlers/cicd-handlers.js";

// Import users and groups handlers
import * as usersGroupsHandlers from "../handlers/users-groups-handlers.js";

/**
 * Registry of all available tools mapped to their handler functions
 */
export const toolRegistry: ToolRegistry = {
  // Repository tools
  gitlab_list_projects: repoHandlers.listProjects,
  gitlab_get_project: repoHandlers.getProject,
  gitlab_list_branches: repoHandlers.listBranches,
  gitlab_list_merge_requests: repoHandlers.listMergeRequests,
  gitlab_get_merge_request: repoHandlers.getMergeRequest,
  gitlab_get_merge_request_changes: repoHandlers.getMergeRequestChanges,
  gitlab_create_merge_request: repoHandlers.createMergeRequest,
  gitlab_create_merge_request_note: repoHandlers.createMergeRequestNote,
  gitlab_create_merge_request_note_internal: repoHandlers.createMergeRequestNoteInternal,
  gitlab_list_merge_request_discussions: repoHandlers.listMergeRequestDiscussions,
  gitlab_get_merge_request_discussion: repoHandlers.getMergeRequestDiscussion,
  gitlab_create_merge_request_discussion: repoHandlers.createMergeRequestDiscussion,
  gitlab_reply_to_discussion: repoHandlers.replyToDiscussion,
  gitlab_resolve_discussion: repoHandlers.resolveDiscussion,
  gitlab_update_merge_request: repoHandlers.updateMergeRequest,
  gitlab_list_issues: repoHandlers.listIssues,
  gitlab_create_issue: repoHandlers.createIssue,
  gitlab_get_repository_file: repoHandlers.getRepositoryFile,
  gitlab_compare_branches: repoHandlers.compareBranches,
  gitlab_get_project_id: repoHandlers.getProjectId,
  gitlab_get_issue: repoHandlers.getIssue,
  gitlab_update_issue: repoHandlers.updateIssue,
  gitlab_create_branch: repoHandlers.createBranch,
  gitlab_delete_branch: repoHandlers.deleteBranch,
  gitlab_mark_merge_request_ready: repoHandlers.markMergeRequestReady,
  gitlab_merge_merge_request: repoHandlers.mergeMergeRequest,

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