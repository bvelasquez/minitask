import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TaskNotesMCPServer {
  private server: Server;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:3000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.server = new Server(
      {
        name: 'task-notes-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private async makeApiRequest(method: string, endpoint: string, body?: any): Promise<any> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`API request to ${url} timed out after 5 seconds`);
        }
        throw new Error(`Failed to make API request to ${url}: ${error.message}`);
      }
      throw new Error(`Failed to make API request to ${url}: ${String(error)}`);
    }
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_tasks',
            description: 'Get all tasks from the task list. Use this to show the user their current tasks or when they ask about what tasks they have. Returns tasks with their completion status, creation date, and order.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'add_task',
            description: 'Add a new task to the task list. Use this when the user wants to create a new task, add something to their todo list, or mentions something they need to do. The task description should be clear and actionable.',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Clear, actionable description of the task to be added',
                },
                order_index: {
                  type: 'number',
                  description: 'Optional position in the task list. If not provided, task will be added at the end',
                },
              },
              required: ['description'],
            },
          },
          {
            name: 'update_task',
            description: 'Update an existing task. Use this to modify task descriptions, mark tasks as complete/incomplete, or change task order. Commonly used when user wants to check off a task, edit task text, or reorganize their list.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'The ID of the task to update',
                },
                description: {
                  type: 'string',
                  description: 'New description for the task (optional)',
                },
                completed: {
                  type: 'boolean',
                  description: 'Whether the task is completed (true) or not (false)',
                },
                order_index: {
                  type: 'number',
                  description: 'New position in the task list (optional)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_task',
            description: 'Remove a task from the task list permanently. Use this when the user explicitly wants to delete or remove a task entirely (not just mark it complete). Be careful as this action cannot be undone.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'The ID of the task to delete',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'reorder_tasks',
            description: 'Reorder multiple tasks at once by providing a new sequence of task IDs. Use this when the user wants to reorganize their task list or change the priority order of multiple tasks.',
            inputSchema: {
              type: 'object',
              properties: {
                task_ids: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of task IDs in the desired new order',
                },
              },
              required: ['task_ids'],
            },
          },
          {
            name: 'list_notes',
            description: 'Get all notes from the notes collection. Use this to show the user their saved notes or when they ask about their notes. Notes are returned in reverse chronological order (newest first).',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'add_note',
            description: 'Add a new note to the notes collection. Use this when the user wants to save information, jot down thoughts, or store reference material. Notes support Markdown formatting for rich text.',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The note content in Markdown format. Can include headers, lists, links, code blocks, etc.',
                },
              },
              required: ['content'],
            },
          },
          {
            name: 'update_note',
            description: 'Update the content of an existing note. Use this when the user wants to edit, modify, or add to an existing note. The entire note content will be replaced with the new content.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'The ID of the note to update',
                },
                content: {
                  type: 'string',
                  description: 'The new note content in Markdown format',
                },
              },
              required: ['id', 'content'],
            },
          },
          {
            name: 'delete_note',
            description: 'Remove a note from the notes collection permanently. Use this when the user explicitly wants to delete a note entirely. Be careful as this action cannot be undone.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'The ID of the note to delete',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'search_notes',
            description: 'Search through notes by content. Use this when the user is looking for specific information in their notes, wants to find notes containing certain keywords, or needs to recall something they wrote down previously.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term or phrase to look for in note content',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'restart_server',
            description: 'Restart the PM2-managed web server. Use this when you need to restart the server after making changes to the code or configuration. This will restart the persistent web server that continues running even after the LLM session ends.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_tasks': {
            const tasks = await this.makeApiRequest('GET', '/tasks');
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tasks, null, 2),
                },
              ],
            };
          }

          case 'add_task': {
            const { description, order_index } = args as { description: string; order_index?: number };
            const task = await this.makeApiRequest('POST', '/tasks', { description, order_index });
            return {
              content: [
                {
                  type: 'text',
                  text: `Task added successfully: ${JSON.stringify(task, null, 2)}`,
                },
              ],
            };
          }

          case 'update_task': {
            const { id, ...updates } = args as { id: number; description?: string; completed?: boolean; order_index?: number };
            try {
              const task = await this.makeApiRequest('PUT', `/tasks/${id}`, updates);
              return {
                content: [
                  {
                    type: 'text',
                    text: `Task updated successfully: ${JSON.stringify(task, null, 2)}`,
                  },
                ],
              };
            } catch (error) {
              if (error instanceof Error && error.message.includes('404')) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Task with ID ${id} not found`,
                    },
                  ],
                  isError: true,
                };
              }
              throw error;
            }
          }

          case 'delete_task': {
            const { id } = args as { id: number };
            try {
              await this.makeApiRequest('DELETE', `/tasks/${id}`);
              return {
                content: [
                  {
                    type: 'text',
                    text: `Task with ID ${id} deleted successfully`,
                  },
                ],
              };
            } catch (error) {
              if (error instanceof Error && error.message.includes('404')) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Task with ID ${id} not found`,
                    },
                  ],
                  isError: true,
                };
              }
              throw error;
            }
          }

          case 'reorder_tasks': {
            const { task_ids } = args as { task_ids: number[] };
            await this.makeApiRequest('POST', '/tasks/reorder', { task_ids });
            return {
              content: [
                {
                  type: 'text',
                  text: 'Tasks reordered successfully',
                },
              ],
            };
          }

          case 'list_notes': {
            const notes = await this.makeApiRequest('GET', '/notes');
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(notes, null, 2),
                },
              ],
            };
          }

          case 'add_note': {
            const { content } = args as { content: string };
            const note = await this.makeApiRequest('POST', '/notes', { content });
            return {
              content: [
                {
                  type: 'text',
                  text: `Note added successfully: ${JSON.stringify(note, null, 2)}`,
                },
              ],
            };
          }

          case 'update_note': {
            const { id, content } = args as { id: number; content: string };
            try {
              const note = await this.makeApiRequest('PUT', `/notes/${id}`, { content });
              return {
                content: [
                  {
                    type: 'text',
                    text: `Note updated successfully: ${JSON.stringify(note, null, 2)}`,
                  },
                ],
              };
            } catch (error) {
              if (error instanceof Error && error.message.includes('404')) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Note with ID ${id} not found`,
                    },
                  ],
                  isError: true,
                };
              }
              throw error;
            }
          }

          case 'delete_note': {
            const { id } = args as { id: number };
            try {
              await this.makeApiRequest('DELETE', `/notes/${id}`);
              return {
                content: [
                  {
                    type: 'text',
                    text: `Note with ID ${id} deleted successfully`,
                  },
                ],
              };
            } catch (error) {
              if (error instanceof Error && error.message.includes('404')) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Note with ID ${id} not found`,
                    },
                  ],
                  isError: true,
                };
              }
              throw error;
            }
          }

          case 'search_notes': {
            const { query } = args as { query: string };
            const notes = await this.makeApiRequest('GET', `/notes/search?q=${encodeURIComponent(query)}`);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(notes, null, 2),
                },
              ],
            };
          }

          case 'restart_server': {
            try {
              console.error('Restarting PM2 web server...');
              await execAsync('pm2 restart task-notes-server');
              
              // Wait a moment for the server to restart
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Verify it restarted successfully
              const { stdout } = await execAsync('pm2 jlist');
              const processes = JSON.parse(stdout);
              const taskNotesApp = processes.find((p: any) => p.name === 'task-notes-server');
              
              if (taskNotesApp && taskNotesApp.pm2_env.status === 'online') {
                return {
                  content: [
                    {
                      type: 'text',
                      text: 'Web server restarted successfully via PM2. The server is now online and ready to handle requests.',
                    },
                  ],
                };
              } else {
                return {
                  content: [
                    {
                      type: 'text',
                      text: 'Server restart command executed, but server status is unclear. Check PM2 status manually if needed.',
                    },
                  ],
                };
              }
            } catch (error) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Failed to restart server: ${error instanceof Error ? error.message : String(error)}`,
                  },
                ],
                isError: true,
              };
            }
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown tool: ${name}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async validateApiConnection(): Promise<boolean> {
    try {
      await this.makeApiRequest('GET', '/tasks');
      return true;
    } catch (error) {
      console.error('Failed to validate API connection:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  async start(): Promise<void> {
    // Validate API connection before starting MCP server
    console.error('Validating API connection...');
    const isConnected = await this.validateApiConnection();
    
    if (!isConnected) {
      throw new Error('Cannot start MCP server: Web API is not accessible at ' + this.apiBaseUrl);
    }
    
    console.error('API connection validated successfully');
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  close(): void {
    // No database connection to close since we're using HTTP API
  }
}
