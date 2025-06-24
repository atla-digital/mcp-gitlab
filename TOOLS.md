# GitLab MCP Server Tools

This document provides details on all available tools in the GitLab MCP server.

Each tool is designed to interact with GitLab APIs, allowing AI assistants to work with repositories, merge requests, issues, CI/CD pipelines, and more.

## Table of Contents

- [Repository Management](#repository-management)
- [Integrations & Webhooks](#integrations--webhooks)
- [CI/CD Management](#cicd-management)
- [User & Group Management](#user--group-management)

## Repository Management

### gitlab_list_projects

List GitLab projects accessible to the user

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `search` | `string` | No | Search projects by name | - |
| `owned` | `boolean` | No | Limit to projects explicitly owned by the current user | - |
| `membership` | `boolean` | No | Limit to projects the current user is a member of | - |
| `per_page` | `number` | No | Number of projects to return per page (max 100) | - |

### gitlab_get_project

Get details of a specific GitLab project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_list_branches

List branches of a GitLab project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `search` | `string` | No | Search branches by name | - |

### gitlab_get_repository_file

Get content of a file in a repository

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `file_path` | `string` | Yes | Path of the file in the repository | - |
| `ref` | `string` | No | The name of branch, tag or commit | - |

### gitlab_compare_branches

Compare branches, tags or commits

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `from` | `string` | Yes | The commit SHA or branch name to compare from | - |
| `to` | `string` | Yes | The commit SHA or branch name to compare to | - |

### gitlab_get_project_id

Extract GitLab project ID from git remote URL

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `remote_url` | `string` | Yes | Raw Git remote URL - pass the actual URL string, not a bash command (e.g., git@gitlab.com:group/project.git or https://gitlab.com/group/project.git) | - |

### gitlab_create_branch

Create new branch for work packages

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `branch` | `string` | Yes | The name of the new branch | - |
| `ref` | `string` | Yes | The source branch or commit SHA | - |

### gitlab_delete_branch

Delete a branch

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `branch` | `string` | Yes | The name of the branch to delete | - |

### gitlab_list_merge_requests

List merge requests in a GitLab project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `state` | `string` | No | Return merge requests with specified state (opened, closed, locked, merged) | - |
| `scope` | `string` | No | Return merge requests for the specified scope (created_by_me, assigned_to_me, all) | - |

### gitlab_get_merge_request

Get details of a specific merge request including commit SHAs, branch names, and metadata. IMPORTANT: This tool provides the diff_refs object containing base_sha, head_sha, and start_sha needed for creating line-specific comments with gitlab_create_merge_request_discussion.

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project (same as used in other GitLab tools) | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request (found in gitlab_list_merge_requests results as "iid" field) | - |

### gitlab_get_merge_request_changes

Get changes (diff) of a specific merge request showing all modified files and their diffs. IMPORTANT: This tool provides file paths (old_path/new_path) needed for creating line-specific comments. Use this to understand what files were changed and their content for code review.

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project (same as used in other GitLab tools) | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field) | - |

### gitlab_create_merge_request_note

Add a comment to a merge request

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request | - |
| `body` | `string` | Yes | The content of the note/comment | - |

### gitlab_create_merge_request_note_internal

Add a comment to a merge request with option to make it an internal note

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request | - |
| `body` | `string` | Yes | The content of the note/comment | - |
| `internal` | `boolean` | No | If true, the note will be marked as an internal note visible only to project members | - |

### gitlab_list_merge_request_discussions

List all discussions (threaded comments) on a merge request. Use this to see existing code review comments, line-specific discussions, and general merge request conversations.

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project (same as used in other GitLab tools) | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field) | - |

### gitlab_get_merge_request_discussion

Get a specific discussion thread on a merge request with all its replies. Use this to read the full conversation thread for a specific code review comment.

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project (same as used in other GitLab tools) | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field) | - |
| `discussion_id` | `string` | Yes | The ID of the discussion to fetch (get this from gitlab_list_merge_request_discussions as "id" field) | - |

### gitlab_create_merge_request_discussion

Create a new discussion thread on a merge request with optional line-specific positioning for code reviews. Supports single-line comments, multi-line comments, and code suggestions. To create line-specific comments, you must provide the position object with commit SHAs from the merge request.

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project (same as used in other GitLab tools) | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request (found in gitlab_list_merge_requests or gitlab_get_merge_request results as "iid" field) | - |
| `body` | `string` | Yes | The content of the discussion. For code suggestions, use GitLab's suggestion syntax: ````suggestion:-0+1\nsuggested code here\n```` | - |
| `position` | `object` | No | Position object for line-specific comments. Omit this property to create a general discussion comment. All SHA values can be obtained from gitlab_get_merge_request under the "diff_refs" object. | - |

### gitlab_create_merge_request

Create a new merge request in a GitLab project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `source_branch` | `string` | Yes | The source branch | - |
| `target_branch` | `string` | Yes | The target branch | - |
| `title` | `string` | Yes | The title of the merge request | - |
| `description` | `string` | No | The description of the merge request | - |
| `assignee_id` | `number` | No | ID of the user to assign the merge request to | - |
| `assignee_ids` | `array` | No | IDs of users to assign the merge request to | - |
| `reviewer_ids` | `array` | No | IDs of users to assign as reviewers | - |
| `target_project_id` | `string` | No | The target project ID (for cross-project merge requests) | - |
| `labels` | `string` | No | Comma-separated list of label names | - |
| `milestone_id` | `number` | No | The ID of a milestone | - |
| `remove_source_branch` | `boolean` | No | Whether to remove the source branch when merging | - |
| `allow_collaboration` | `boolean` | No | Allow commits from members who can merge to the target branch | - |
| `squash` | `boolean` | No | Squash commits into a single commit when merging | - |

### gitlab_update_merge_request

Update a merge request title and description

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request | - |
| `title` | `string` | No | The title of the merge request | - |
| `description` | `string` | No | The description of the merge request | - |

### gitlab_mark_merge_request_ready

Mark draft MR as ready for review

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request | - |

### gitlab_merge_merge_request

Merge approved merge requests

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `merge_request_iid` | `number` | Yes | The internal ID of the merge request | - |
| `merge_commit_message` | `string` | No | Custom merge commit message | - |
| `squash` | `boolean` | No | Squash commits into a single commit when merging | - |
| `should_remove_source_branch` | `boolean` | No | Remove source branch after merging | - |

### gitlab_list_issues

List issues in a GitLab project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `state` | `string` | No | Return issues with specified state (opened, closed) | - |
| `labels` | `string` | No | Comma-separated list of label names | - |

### gitlab_create_issue

Create a new issue in a GitLab project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `title` | `string` | Yes | The title of the issue | - |
| `description` | `string` | No | The description of the issue | - |
| `labels` | `string` | No | Comma-separated list of label names | - |
| `assignee_ids` | `array` | No | IDs of users to assign the issue to | - |
| `confidential` | `boolean` | No | Whether the issue should be confidential | - |

### gitlab_get_issue

Get specific issue details

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `issue_iid` | `number` | Yes | The internal ID of the issue | - |

### gitlab_update_issue

Update issue details (assign, labels, status, etc.)

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `issue_iid` | `number` | Yes | The internal ID of the issue | - |
| `title` | `string` | No | The title of the issue | - |
| `description` | `string` | No | The description of the issue | - |
| `assignee_ids` | `array` | No | IDs of users to assign the issue to | - |
| `labels` | `string` | No | Comma-separated list of label names | - |
| `state_event` | `string` | No | State event (close or reopen) | - |

### gitlab_list_issue_links

List linked issues for a specific issue

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `issue_iid` | `number` | Yes | The internal ID of the issue | - |

### gitlab_create_issue_link

Create a link between two issues (parent-child, blocking, related)

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `issue_iid` | `number` | Yes | The internal ID of the source issue | - |
| `target_project_id` | `string` | Yes | The ID or URL-encoded path of the target project | - |
| `target_issue_iid` | `number` | Yes | The internal ID of the target issue to link | - |
| `link_type` | `string` | No | The type of link relationship | `relates_to` |

### gitlab_delete_issue_link

Remove a link between two issues

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `issue_iid` | `number` | Yes | The internal ID of the source issue | - |
| `issue_link_id` | `number` | Yes | The ID of the issue link to delete | - |

### gitlab_list_project_members

List members of a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_add_project_member

Add a user to a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `user_id` | `number` | Yes | The ID of the user | - |
| `access_level` | `number` | Yes | Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner) | - |

## Integrations & Webhooks

### gitlab_list_integrations

List all available project integrations/services

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_get_integration

Get integration details for a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `integration` | `string` | Yes | The name of the integration (e.g., slack) | - |

### gitlab_update_slack_integration

Update Slack integration settings for a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `webhook` | `string` | Yes | The Slack webhook URL | - |
| `username` | `string` | No | The Slack username | - |
| `channel` | `string` | No | The Slack channel name | - |

### gitlab_disable_slack_integration

Disable Slack integration for a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_list_webhooks

List webhooks for a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_get_webhook

Get details of a specific webhook

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `webhook_id` | `number` | Yes | The ID of the webhook | - |

### gitlab_add_webhook

Add a new webhook to a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `url` | `string` | Yes | The webhook URL | - |
| `token` | `string` | No | Secret token to validate received payloads | - |
| `push_events` | `boolean` | No | Trigger webhook for push events | - |
| `issues_events` | `boolean` | No | Trigger webhook for issues events | - |
| `merge_requests_events` | `boolean` | No | Trigger webhook for merge request events | - |
| `enable_ssl_verification` | `boolean` | No | Enable SSL verification for the webhook | - |

### gitlab_update_webhook

Update an existing webhook

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `webhook_id` | `number` | Yes | The ID of the webhook | - |
| `url` | `string` | Yes | The webhook URL | - |
| `token` | `string` | No | Secret token to validate received payloads | - |
| `push_events` | `boolean` | No | Trigger webhook for push events | - |
| `issues_events` | `boolean` | No | Trigger webhook for issues events | - |
| `merge_requests_events` | `boolean` | No | Trigger webhook for merge request events | - |
| `enable_ssl_verification` | `boolean` | No | Enable SSL verification for the webhook | - |

### gitlab_delete_webhook

Delete a webhook

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `webhook_id` | `number` | Yes | The ID of the webhook | - |

### gitlab_test_webhook

Test a webhook

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `webhook_id` | `number` | Yes | The ID of the webhook | - |

## CI/CD Management

### gitlab_list_pipelines

List pipelines for a project/branch to monitor CI/CD status

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `ref` | `string` | No | Filter by branch name | - |
| `status` | `string` | No | Filter by pipeline status | - |
| `per_page` | `number` | No | Number of pipelines to return per page (max 100) | - |

### gitlab_get_pipeline

Get pipeline status and details for monitoring

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `pipeline_id` | `number` | Yes | The ID of the pipeline | - |

### gitlab_get_pipeline_jobs

Get jobs within a pipeline to identify failures

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `pipeline_id` | `number` | Yes | The ID of the pipeline | - |
| `scope` | `string` | No | Filter by job scope | - |

### gitlab_list_trigger_tokens

List pipeline trigger tokens

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_get_trigger_token

Get details of a pipeline trigger token

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `trigger_id` | `number` | Yes | The ID of the trigger | - |

### gitlab_create_trigger_token

Create a new pipeline trigger token

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `description` | `string` | Yes | The trigger description | - |

### gitlab_update_trigger_token

Update a pipeline trigger token

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `trigger_id` | `number` | Yes | The ID of the trigger | - |
| `description` | `string` | Yes | The new trigger description | - |

### gitlab_delete_trigger_token

Delete a pipeline trigger token

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `trigger_id` | `number` | Yes | The ID of the trigger | - |

### gitlab_trigger_pipeline

Trigger a pipeline run

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `ref` | `string` | Yes | The branch or tag name to run the pipeline for | - |
| `token` | `string` | Yes | The trigger token | - |
| `variables` | `object` | No | Variables to pass to the pipeline | - |

### gitlab_list_cicd_variables

List CI/CD variables for a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_get_cicd_variable

Get a specific CI/CD variable

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `key` | `string` | Yes | The key of the variable | - |

### gitlab_create_cicd_variable

Create a new CI/CD variable

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `key` | `string` | Yes | The key of the variable | - |
| `value` | `string` | Yes | The value of the variable | - |
| `protected` | `boolean` | No | Whether the variable is protected | - |
| `masked` | `boolean` | No | Whether the variable is masked | - |

### gitlab_update_cicd_variable

Update a CI/CD variable

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `key` | `string` | Yes | The key of the variable | - |
| `value` | `string` | Yes | The value of the variable | - |
| `protected` | `boolean` | No | Whether the variable is protected | - |
| `masked` | `boolean` | No | Whether the variable is masked | - |

### gitlab_delete_cicd_variable

Delete a CI/CD variable

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `key` | `string` | Yes | The key of the variable | - |

## User & Group Management

### gitlab_list_users

List GitLab users

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `search` | `string` | No | Search users by username, name or email | - |
| `active` | `boolean` | No | Filter users by active status | - |

### gitlab_get_current_user

Get details of the currently authenticated user

This tool does not require any parameters.

### gitlab_get_user

Get details of a specific user

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `user_id` | `number` | Yes | The ID of the user | - |

### gitlab_list_groups

List GitLab groups

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `search` | `string` | No | Search groups by name | - |
| `owned` | `boolean` | No | Limit to groups explicitly owned by the current user | - |

### gitlab_get_group

Get details of a specific group

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `group_id` | `string` | Yes | The ID or URL-encoded path of the group | - |

### gitlab_list_group_members

List members of a group

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `group_id` | `string` | Yes | The ID or URL-encoded path of the group | - |

### gitlab_add_group_member

Add a user to a group

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `group_id` | `string` | Yes | The ID or URL-encoded path of the group | - |
| `user_id` | `number` | Yes | The ID of the user | - |
| `access_level` | `number` | Yes | Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner) | - |

### gitlab_list_project_members

List members of a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |

### gitlab_add_project_member

Add a user to a project

**Parameters:**

| Name | Type | Required | Description | Default |
| ---- | ---- | -------- | ----------- | ------- |
| `project_id` | `string` | Yes | The ID or URL-encoded path of the project | - |
| `user_id` | `number` | Yes | The ID of the user | - |
| `access_level` | `number` | Yes | Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner) | - |

---

Generated automatically from `src/tools/definitions/`
