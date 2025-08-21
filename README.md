# Task & Notes MCP Server

A modern MCP (Model Context Protocol) server for task and notes management with an integrated web dashboard. This server allows LLMs to manage tasks and notes while providing a clean web interface for human interaction.

## Features

### MCP Tools for LLMs
- **Task Management**: Add, update, delete, reorder, and list tasks
- **Notes Management**: Add, update, delete, search, and list notes with Markdown support
- **Persistent Storage**: SQLite database for reliable data persistence
- **Rich Context**: Clear tool descriptions help LLMs understand when and how to use each tool

### Web Dashboard
- **Clean Interface**: Modern, responsive design
- **Task Features**: Checkbox completion, drag-and-drop reordering, multi-line support, clickable links, creation dates
- **Notes Features**: Markdown rendering, search functionality, edit modal
- **Auto-Launch**: Dashboard opens automatically when server starts

## Installation

1. **Clone or create the project directory**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

## Usage

### Web Dashboard Mode (Default)
Start the server with integrated web dashboard:
```bash
npm start
# or
npm run dev  # for development with auto-reload
```

The dashboard will automatically open at `http://localhost:3000/dashboard`

### MCP Server Mode
To use as an MCP server for LLM integration:
```bash
npm run build
node dist/index.js --mcp
```

Or set the environment variable:
```bash
NODE_ENV=mcp npm start
```

#### Browser Management Options
- `--no-browser` - Disable automatic browser opening
- `--force-browser` - Force open browser even if already detected as open
- `--clear-browser-lock` - Clear the browser lock file and exit (useful for troubleshooting)

The server automatically detects if the dashboard is already open in a browser tab to avoid opening duplicate tabs. It uses a lock file with timestamp and process validation to track browser state. If you need to force open a new tab, use the `--force-browser` flag.



## MCP Integration

### Adding to MCP Client Configuration

Add this server to your MCP client configuration (e.g., `mcp-config.json`):

```json
{
  "mcpServers": {
    "task-notes": {
      "command": "node",
      "args": ["dist/index.js", "--mcp"],
      "cwd": "/path/to/task-notes-mcp-server",
      "env": {
        "NODE_ENV": "mcp"
      }
    }
  }
}
```

### Available MCP Tools

#### Task Management
- `list_tasks` - Get all tasks with completion status and metadata
- `add_task` - Create a new task with description and optional order
- `update_task` - Modify task description, completion status, or order
- `delete_task` - Remove a task permanently
- `reorder_tasks` - Reorganize multiple tasks by ID sequence

#### Notes Management
- `list_notes` - Get all notes in reverse chronological order
- `add_note` - Create a new note with Markdown content
- `update_note` - Edit existing note content
- `delete_note` - Remove a note permanently
- `search_notes` - Find notes containing specific text

#### Server Management
- `restart_server` - Restart the PM2-managed web server (useful after code changes)

## Database Schema

### Tasks Table
- `id` - Primary key
- `description` - Task description text
- `completed` - Boolean completion status
- `order_index` - Integer for custom ordering
- `created_at` - Creation timestamp
- `updated_at` - Last modification timestamp

### Notes Table
- `id` - Primary key
- `content` - Note content in Markdown format
- `created_at` - Creation timestamp
- `updated_at` - Last modification timestamp

## Development

### Project Structure
```
├── src/
│   ├── index.ts          # Main entry point
│   ├── database.ts       # SQLite database layer
│   ├── mcp-server.ts     # MCP protocol implementation
│   └── web-server.ts     # Express web server
├── public/
│   ├── index.html        # Dashboard HTML
│   ├── styles.css        # Dashboard styles
│   └── app.js           # Dashboard JavaScript
├── dist/                 # Compiled TypeScript output
└── tasks_notes.db       # SQLite database file
```

### Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Development mode with auto-reload
- `npm start` - Start the built server
- `npm run clean` - Remove compiled files

### API Endpoints
The web server exposes REST API endpoints that mirror the MCP tools:

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/reorder` - Reorder tasks

- `GET /api/notes` - List all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/search?q=query` - Search notes

## Multi-line Task Support

Tasks now support multiple lines of text for better organization:

### In the Web Dashboard
- **Creating Tasks**: Use `Shift+Enter` to add new lines, `Enter` to save
- **Editing Tasks**: Click edit button, use `Shift+Enter` for new lines, `Enter` to save
- **Display**: Multi-line tasks are displayed with proper line breaks
- **Clickable Links**: URLs (http, https, www) are automatically converted to clickable links that open in new tabs

### Via MCP/LLM
Multi-line tasks work seamlessly through the MCP interface:
```
"Add a task with multiple steps:
- Step 1: Research options
- Step 2: Compare prices  
- Step 3: Make decision"
```

## Example LLM Interactions

### Adding Tasks
> "Add a task to buy groceries"

The LLM will use the `add_task` tool with description "Buy groceries"

### Managing Notes
> "Save a note about the meeting agenda: discuss budget, review timeline, assign tasks"

The LLM will use the `add_note` tool with the meeting content in Markdown format

### Searching Information
> "Find my notes about the budget"

The LLM will use the `search_notes` tool with query "budget"

## License

MIT License - feel free to use and modify as needed.
