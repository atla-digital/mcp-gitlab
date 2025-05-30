/**
 * GitLab CI/CD Manager
 * 
 * This module provides functions for managing GitLab CI/CD pipelines, variables,
 * triggers, and runners through the GitLab API.
 */

import { AxiosInstance } from "axios";

/**
 * Class to manage GitLab CI/CD features
 */
export class CiCdManager {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  // Pipeline Operations
  /**
   * List pipelines for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param options Filter options
   * @returns List of pipelines
   */
  async listPipelines(projectId: string | number, options: {
    status?: string;
    ref?: string;
    sha?: string;
    yaml_errors?: boolean;
    name?: string;
    username?: string;
    updated_after?: string;
    updated_before?: string;
    order_by?: string;
    sort?: string;
    per_page?: number;
    page?: number;
  } = {}) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/pipelines`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list pipelines');
    }
  }

  /**
   * Get details of a specific pipeline
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param pipelineId ID of the pipeline
   * @returns Pipeline details
   */
  async getPipeline(projectId: string | number, pipelineId: number) {
    try {
      const response = await this.axiosInstance.get(
        `/projects/${encodeURIComponent(String(projectId))}/pipelines/${pipelineId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get pipeline: ${pipelineId}`);
    }
  }

  /**
   * Get jobs for a specific pipeline
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param pipelineId ID of the pipeline
   * @param scope Filter by job scope
   * @returns List of jobs
   */
  async getPipelineJobs(projectId: string | number, pipelineId: number, scope?: string) {
    try {
      const response = await this.axiosInstance.get(
        `/projects/${encodeURIComponent(String(projectId))}/pipelines/${pipelineId}/jobs`,
        { params: scope ? { scope } : {} }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get pipeline jobs: ${pipelineId}`);
    }
  }

  /**
   * Get job log
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param jobId ID of the job
   * @returns Job log
   */
  async getJobLog(projectId: string | number, jobId: number) {
    try {
      const response = await this.axiosInstance.get(
        `/projects/${encodeURIComponent(String(projectId))}/jobs/${jobId}/trace`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get job log: ${jobId}`);
    }
  }

  /**
   * Retry a job
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param jobId ID of the job
   * @returns Job details
   */
  async retryJob(projectId: string | number, jobId: number) {
    try {
      const response = await this.axiosInstance.post(
        `/projects/${encodeURIComponent(String(projectId))}/jobs/${jobId}/retry`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to retry job: ${jobId}`);
    }
  }

  // Trigger Token Operations
  /**
   * List pipeline trigger tokens for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @returns List of pipeline trigger tokens
   */
  async listTriggerTokens(projectId: string | number) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/triggers`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list trigger tokens');
    }
  }

  /**
   * Get details of a specific trigger token
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param triggerId ID of the trigger token
   * @returns Trigger token details
   */
  async getTriggerToken(projectId: string | number, triggerId: number) {
    try {
      const response = await this.axiosInstance.get(
        `/projects/${encodeURIComponent(String(projectId))}/triggers/${triggerId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get trigger token: ${triggerId}`);
    }
  }

  /**
   * Create a new pipeline trigger token
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param description Description for the trigger token
   * @returns Created trigger token
   */
  async createTriggerToken(projectId: string | number, description: string) {
    try {
      const response = await this.axiosInstance.post(
        `/projects/${encodeURIComponent(String(projectId))}/triggers`,
        { description }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create trigger token');
    }
  }

  /**
   * Update a trigger token description
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param triggerId ID of the trigger token
   * @param description New description
   * @returns Updated trigger token
   */
  async updateTriggerToken(projectId: string | number, triggerId: number, description: string) {
    try {
      const response = await this.axiosInstance.put(
        `/projects/${encodeURIComponent(String(projectId))}/triggers/${triggerId}`,
        { description }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update trigger token: ${triggerId}`);
    }
  }

  /**
   * Delete a trigger token
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param triggerId ID of the trigger token
   * @returns Confirmation of deletion
   */
  async deleteTriggerToken(projectId: string | number, triggerId: number) {
    try {
      const response = await this.axiosInstance.delete(
        `/projects/${encodeURIComponent(String(projectId))}/triggers/${triggerId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete trigger token: ${triggerId}`);
    }
  }

  /**
   * Trigger a pipeline
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param ref Branch or tag name
   * @param token Trigger token
   * @param variables Pipeline variables
   * @returns Pipeline details
   */
  async triggerPipeline(projectId: string | number, ref: string, token: string, variables: Record<string, string> = {}) {
    try {
      const response = await this.axiosInstance.post(
        `/projects/${encodeURIComponent(String(projectId))}/trigger/pipeline`,
        { ref, token, variables }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to trigger pipeline');
    }
  }

  // CI/CD Variables Operations
  /**
   * List CI/CD variables for a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @returns List of CI/CD variables
   */
  async listCiCdVariables(projectId: string | number) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/variables`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list CI/CD variables');
    }
  }

  /**
   * Get a specific CI/CD variable
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param key Variable key
   * @returns Variable details
   */
  async getCiCdVariable(projectId: string | number, key: string) {
    try {
      const response = await this.axiosInstance.get(
        `/projects/${encodeURIComponent(String(projectId))}/variables/${encodeURIComponent(key)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get CI/CD variable: ${key}`);
    }
  }

  /**
   * Create a new CI/CD variable
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param variableData Variable configuration
   * @returns Created variable
   */
  async createCiCdVariable(projectId: string | number, variableData: {
    key: string;
    value: string;
    protected?: boolean;
    masked?: boolean;
    environment_scope?: string;
    variable_type?: string;
  }) {
    try {
      const response = await this.axiosInstance.post(
        `/projects/${encodeURIComponent(String(projectId))}/variables`,
        variableData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create CI/CD variable: ${variableData.key}`);
    }
  }

  /**
   * Update a CI/CD variable
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param key Variable key
   * @param variableData Updated variable configuration
   * @returns Updated variable
   */
  async updateCiCdVariable(projectId: string | number, key: string, variableData: {
    value: string;
    protected?: boolean;
    masked?: boolean;
    environment_scope?: string;
    variable_type?: string;
  }) {
    try {
      const response = await this.axiosInstance.put(
        `/projects/${encodeURIComponent(String(projectId))}/variables/${encodeURIComponent(key)}`,
        variableData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update CI/CD variable: ${key}`);
    }
  }

  /**
   * Delete a CI/CD variable
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param key Variable key
   * @returns Confirmation of deletion
   */
  async deleteCiCdVariable(projectId: string | number, key: string) {
    try {
      const response = await this.axiosInstance.delete(
        `/projects/${encodeURIComponent(String(projectId))}/variables/${encodeURIComponent(key)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete CI/CD variable: ${key}`);
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