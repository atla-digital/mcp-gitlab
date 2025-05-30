/**
 * GitLab Users and Groups Manager
 * 
 * This module provides functions for managing GitLab users, groups, and memberships
 * through the GitLab API.
 */

import { AxiosInstance } from "axios";

/**
 * Class to manage GitLab users and groups
 */
export class UsersGroupsManager {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  // User Operations
  /**
   * List users
   * 
   * @param options Filter options
   * @returns List of users
   */
  async listUsers(options: {
    search?: string;
    username?: string;
    active?: boolean;
    blocked?: boolean;
    external?: boolean;
    exclude_internal?: boolean;
    exclude_external?: boolean;
    without_project_bots?: boolean;
    admins?: boolean;
    order_by?: string;
    sort?: string;
    per_page?: number;
    page?: number;
  } = {}) {
    try {
      const response = await this.axiosInstance.get('/users', { params: options });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list users');
    }
  }

  /**
   * Get current user details
   * 
   * @returns Current user details
   */
  async getCurrentUser() {
    try {
      const response = await this.axiosInstance.get('/user');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get current user');
    }
  }

  /**
   * Get specific user details
   * 
   * @param userId ID of the user
   * @returns User details
   */
  async getUser(userId: number) {
    try {
      const response = await this.axiosInstance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get user: ${userId}`);
    }
  }

  // Group Operations
  /**
   * List groups
   * 
   * @param options Filter options
   * @returns List of groups
   */
  async listGroups(options: {
    search?: string;
    skip_groups?: number[];
    all_available?: boolean;
    sort?: string;
    order_by?: string;
    owned?: boolean;
    min_access_level?: number;
    top_level_only?: boolean;
    statistics?: boolean;
    with_custom_attributes?: boolean;
    per_page?: number;
    page?: number;
  } = {}) {
    try {
      const response = await this.axiosInstance.get('/groups', { params: options });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list groups');
    }
  }

  /**
   * Get group details
   * 
   * @param groupId ID or URL-encoded path of the group
   * @param options Additional options
   * @returns Group details
   */
  async getGroup(groupId: string | number, options: {
    with_custom_attributes?: boolean;
    with_projects?: boolean;
  } = {}) {
    try {
      const response = await this.axiosInstance.get(`/groups/${encodeURIComponent(String(groupId))}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get group: ${groupId}`);
    }
  }

  /**
   * List group members
   * 
   * @param groupId ID or URL-encoded path of the group
   * @param options Filter options
   * @returns List of group members
   */
  async listGroupMembers(groupId: string | number, options: {
    query?: string;
    user_ids?: number[];
    skip_users?: number[];
    show_seat_info?: boolean;
    per_page?: number;
    page?: number;
  } = {}) {
    try {
      const response = await this.axiosInstance.get(`/groups/${encodeURIComponent(String(groupId))}/members`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to list group members: ${groupId}`);
    }
  }

  /**
   * Add a member to a group
   * 
   * @param groupId ID or URL-encoded path of the group
   * @param userId ID of the user
   * @param accessLevel Access level for the user
   * @param options Additional options
   * @returns Member details
   */
  async addGroupMember(groupId: string | number, userId: number, accessLevel: number, options: {
    expires_at?: string;
  } = {}) {
    try {
      const response = await this.axiosInstance.post(`/groups/${encodeURIComponent(String(groupId))}/members`, {
        user_id: userId,
        access_level: accessLevel,
        ...options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to add group member: ${userId} to ${groupId}`);
    }
  }

  /**
   * Edit a group member
   * 
   * @param groupId ID or URL-encoded path of the group
   * @param userId ID of the user
   * @param accessLevel New access level
   * @param options Additional options
   * @returns Updated member details
   */
  async editGroupMember(groupId: string | number, userId: number, accessLevel: number, options: {
    expires_at?: string;
  } = {}) {
    try {
      const response = await this.axiosInstance.put(`/groups/${encodeURIComponent(String(groupId))}/members/${userId}`, {
        access_level: accessLevel,
        ...options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to edit group member: ${userId} in ${groupId}`);
    }
  }

  /**
   * Remove a member from a group
   * 
   * @param groupId ID or URL-encoded path of the group
   * @param userId ID of the user
   * @returns Confirmation of removal
   */
  async removeGroupMember(groupId: string | number, userId: number) {
    try {
      const response = await this.axiosInstance.delete(`/groups/${encodeURIComponent(String(groupId))}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to remove group member: ${userId} from ${groupId}`);
    }
  }

  // Project Membership Operations
  /**
   * List project members
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param options Filter options
   * @returns List of project members
   */
  async listProjectMembers(projectId: string | number, options: {
    query?: string;
    user_ids?: number[];
    skip_users?: number[];
    show_seat_info?: boolean;
    per_page?: number;
    page?: number;
  } = {}) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/members`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to list project members: ${projectId}`);
    }
  }

  /**
   * Get project member details
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param userId ID of the user
   * @returns Member details
   */
  async getProjectMember(projectId: string | number, userId: number) {
    try {
      const response = await this.axiosInstance.get(`/projects/${encodeURIComponent(String(projectId))}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get project member: ${userId} in ${projectId}`);
    }
  }

  /**
   * Add a member to a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param userId ID of the user
   * @param accessLevel Access level for the user
   * @param options Additional options
   * @returns Member details
   */
  async addProjectMember(projectId: string | number, userId: number, accessLevel: number, options: {
    expires_at?: string;
  } = {}) {
    try {
      const response = await this.axiosInstance.post(`/projects/${encodeURIComponent(String(projectId))}/members`, {
        user_id: userId,
        access_level: accessLevel,
        ...options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to add project member: ${userId} to ${projectId}`);
    }
  }

  /**
   * Edit a project member
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param userId ID of the user
   * @param accessLevel New access level
   * @param options Additional options
   * @returns Updated member details
   */
  async editProjectMember(projectId: string | number, userId: number, accessLevel: number, options: {
    expires_at?: string;
  } = {}) {
    try {
      const response = await this.axiosInstance.put(`/projects/${encodeURIComponent(String(projectId))}/members/${userId}`, {
        access_level: accessLevel,
        ...options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to edit project member: ${userId} in ${projectId}`);
    }
  }

  /**
   * Remove a member from a project
   * 
   * @param projectId ID or URL-encoded path of the project
   * @param userId ID of the user
   * @returns Confirmation of removal
   */
  async removeProjectMember(projectId: string | number, userId: number) {
    try {
      const response = await this.axiosInstance.delete(`/projects/${encodeURIComponent(String(projectId))}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to remove project member: ${userId} from ${projectId}`);
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