/**
 * Users and groups tool definitions
 */

export const usersGroupsToolDefinitions = [
  {
    name: 'gitlab_list_users',
    description: 'List GitLab users',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search users by username, name or email'
        },
        active: {
          type: 'boolean',
          description: 'Filter users by active status'
        }
      }
    }
  },
  {
    name: 'gitlab_get_current_user',
    description: 'Get details of the currently authenticated user',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'gitlab_get_user',
    description: 'Get details of a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'number',
          description: 'The ID of the user'
        }
      },
      required: ['user_id']
    }
  },
  {
    name: 'gitlab_list_groups',
    description: 'List GitLab groups',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search groups by name'
        },
        owned: {
          type: 'boolean',
          description: 'Limit to groups explicitly owned by the current user'
        }
      }
    }
  },
  {
    name: 'gitlab_get_group',
    description: 'Get details of a specific group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the group'
        }
      },
      required: ['group_id']
    }
  },
  {
    name: 'gitlab_list_group_members',
    description: 'List members of a group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the group'
        }
      },
      required: ['group_id']
    }
  },
  {
    name: 'gitlab_add_group_member',
    description: 'Add a user to a group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the group'
        },
        user_id: {
          type: 'number',
          description: 'The ID of the user'
        },
        access_level: {
          type: 'number',
          description: 'Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)',
          enum: [10, 20, 30, 40, 50]
        }
      },
      required: ['group_id', 'user_id', 'access_level']
    }
  },
  {
    name: 'gitlab_list_project_members',
    description: 'List members of a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        }
      },
      required: ['project_id']
    }
  },
  {
    name: 'gitlab_add_project_member',
    description: 'Add a user to a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The ID or URL-encoded path of the project'
        },
        user_id: {
          type: 'number',
          description: 'The ID of the user'
        },
        access_level: {
          type: 'number',
          description: 'Access level (10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner)',
          enum: [10, 20, 30, 40, 50]
        }
      },
      required: ['project_id', 'user_id', 'access_level']
    }
  }
];