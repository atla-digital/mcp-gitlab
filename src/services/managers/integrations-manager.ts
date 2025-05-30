/**
 * GitLab Integrations Manager
 * 
 * This module provides functions for managing GitLab project integrations/webhooks
 * through the GitLab API.
 */

import { AxiosInstance } from "axios";

/**
 * Class to manage GitLab project integrations and webhooks
 */
export class IntegrationsManager {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * List all active integrations for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @returns List of project integrations
   */
  async listIntegrations(projectId: string | number) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/integrations`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list integrations');
    }
  }

  /**
   * Get details of a specific integration
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param integrationSlug Slug of the integration (e.g., 'slack', 'jira', 'gitlab-slack-application')
   * @returns Integration details
   */
  async getIntegration(projectId: string | number, integrationSlug: string) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/integrations/${integrationSlug}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get integration: ${integrationSlug}`);
    }
  }

  /**
   * Update Slack integration for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param settings Slack integration settings
   * @returns Updated integration settings
   */
  async updateSlackIntegration(projectId: string | number, settings: {
    webhook: string;
    username?: string;
    channel?: string;
    push_events?: boolean;
    issues_events?: boolean;
    merge_requests_events?: boolean;
    tag_push_events?: boolean;
    note_events?: boolean;
    confidential_issues_events?: boolean;
    pipeline_events?: boolean;
    wiki_page_events?: boolean;
    deployment_events?: boolean;
    job_events?: boolean;
    confidential_note_events?: boolean;
    push_channel?: string;
    issue_channel?: string;
    merge_request_channel?: string;
    note_channel?: string;
    tag_push_channel?: string;
    pipeline_channel?: string;
    wiki_page_channel?: string;
    deployment_channel?: string;
    notify_only_broken_pipelines?: boolean;
    notify_only_default_branch?: boolean;
  }) {
    try {
      const response = await this.axiosInstance.put(
        `/projects/${encodeURIComponent(String(projectId))}/integrations/slack`,
        settings
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update Slack integration');
    }
  }

  /**
   * Disable Slack integration for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @returns Confirmation of disabled integration
   */
  async disableSlackIntegration(projectId: string | number) {
    try {
      const response = await this.axiosInstance.delete(`/projects/${encodeURIComponent(String(projectId))}/integrations/slack`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to disable Slack integration');
    }
  }

  /**
   * List webhooks for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @returns List of webhooks
   */
  async listWebhooks(projectId: string | number) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/hooks`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list webhooks');
    }
  }

  /**
   * Get details of a specific webhook
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param hookId ID of the webhook
   * @returns Webhook details
   */
  async getWebhook(projectId: string | number, hookId: number) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/hooks/${hookId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get webhook: ${hookId}`);
    }
  }

  /**
   * Add a new webhook to a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param hookData Webhook configuration
   * @returns Created webhook details
   */
  async addWebhook(projectId: string | number, hookData: {
    url: string;
    token?: string;
    push_events?: boolean;
    issues_events?: boolean;
    merge_requests_events?: boolean;
    tag_push_events?: boolean;
    note_events?: boolean;
    job_events?: boolean;
    pipeline_events?: boolean;
    wiki_page_events?: boolean;
    deployment_events?: boolean;
    releases_events?: boolean;
    enable_ssl_verification?: boolean;
    push_events_branch_filter?: string;
  }) {
    try {
      const response = await this.axiosInstance.post(`/projects/${encodeURIComponent(String(projectId))}/hooks`, hookData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to add webhook');
    }
  }

  /**
   * Update an existing webhook
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param hookId ID of the webhook to update
   * @param hookData Updated webhook configuration
   * @returns Updated webhook details
   */
  async updateWebhook(projectId: string | number, hookId: number, hookData: {
    url: string;
    token?: string;
    push_events?: boolean;
    issues_events?: boolean;
    merge_requests_events?: boolean;
    tag_push_events?: boolean;
    note_events?: boolean;
    job_events?: boolean;
    pipeline_events?: boolean;
    wiki_page_events?: boolean;
    deployment_events?: boolean;
    releases_events?: boolean;
    enable_ssl_verification?: boolean;
    push_events_branch_filter?: string;
  }) {
    try {
      const response = await this.axiosInstance.put(`/projects/${encodeURIComponent(String(projectId))}/hooks/${hookId}`, hookData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update webhook: ${hookId}`);
    }
  }

  /**
   * Delete a webhook
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param hookId ID of the webhook to delete
   * @returns Confirmation of deletion
   */
  async deleteWebhook(projectId: string | number, hookId: number) {
    try {
      const response = await this.axiosInstance.delete(`/projects/${encodeURIComponent(String(projectId))}/hooks/${hookId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete webhook: ${hookId}`);
    }
  }

  /**
   * Test a webhook
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param hookId ID of the webhook to test
   * @returns Test result
   */
  async testWebhook(projectId: string | number, hookId: number) {
    try {
      const response = await this.axiosInstance.post(`/projects/${encodeURIComponent(String(projectId))}/hooks/${hookId}/test/push_events`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to test webhook: ${hookId}`);
    }
  }

  /**
   * Handle API errors and provide meaningful error messages
   * 
   * @param error Original error object
   * @param context Context of the operation that failed
   * @returns Enhanced error
   */
  private handleError(error: any, context: string): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      return new Error(`${context}: ${status} - ${message}`);
    }
    return new Error(`${context}: ${error.message}`);
  }
}