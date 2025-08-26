# Task & Notes MCP Server

A modern MCP (Model Context Protocol) server for task and notes management with an integrated React web dashboard. This project provides a dual-mode architecture: a standalone web server managed by PM2 for the dashboard interface, and an MCP server that communicates with LLMs while using the web server's API for data operations.

## Architecture

### Dual-Mode Design

This project uses a sophisticated dual-mode architecture:

1. **PM2-Managed Web Server** (`standalone-web-server.ts`):
   - Runs continuously via PM2 on port 3020
   - Serves the React frontend dashboard 
   - Provides REST API endpoints
   - Handles WebSocket connections for real-time updates
   - Independent of MCP server lifecycle

2. **MCP Server** (`mcp-server.ts`):
   - Communicates with LLMs via stdio protocol
   - Makes HTTP requests to the web server's API
   - Ensures web server is running before starting
   - Can auto-restart web server if needed

### Component Overview

- **Frontend**: React TypeScript application with Vite build system
- **Backend**: Express.js server with Socket.io for real-time updates
- **Database**: SQLite for persistent storage
- **Process Management**: PM2 for web server lifecycle
- **MCP Protocol**: SDK-based implementation for LLM communication

## Features

### MCP Tools for LLMs

- **Task Management**: Add, update, delete, reorder, and list tasks
- **Notes Management**: Add, update, delete, search, and list notes with Markdown support
- **Persistent Storage**: SQLite database for reliable data persistence
- **Rich Context**: Clear tool descriptions help LLMs understand when and how to use each tool

### Web Dashboard

- **Modern React Interface**: TypeScript-based frontend with Vite bundling
- **Real-time Updates**: WebSocket integration for live synchronization
- **Task Features**: Checkbox completion, drag-and-drop reordering, multi-line support, clickable links, creation dates
- **Notes Features**: Markdown rendering, search functionality, edit modal, tag support
- **Theme Support**: Dark/light mode toggle with persistence
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. **Clone or create the project directory**
2. **Install PM2 globally**:

   ```bash
   npm install -g pm2
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Build the TypeScript code**:

   ```bash
   npm run build
   ```

5. **Start the server with PM2**:

   ```bash
   npm run server:start
   ```

6. **Start the MCP server** (add to your MCP config as shown below)

## Usage

### Quick Start

1. **Start the PM2-managed web server:**
   ```bash
   npm run server:start
   ```
   This starts the standalone web server at `http://localhost:3020`

2. **Access the dashboard:**
   - Open `http://localhost:3020` in your browser
   - The React frontend provides the full task and notes interface

3. **Use the MCP server:**
   - Configure your MCP client to connect (see MCP Integration section)
   - The MCP server will automatically ensure the web server is running
   - All MCP operations use the web server's API

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

### Available npm Scripts

- `npm run build` - Build both frontend and backend
- `npm run build:frontend` - Build only the React frontend
- `npm run build:backend` - Build only the TypeScript backend
- `npm run dev` - Development mode with auto-reload
- `npm run dev:frontend` - Frontend development server only
- `npm run server:start` - Start PM2-managed web server
- `npm run server:stop` - Stop PM2 web server
- `npm run server:restart` - Restart PM2 web server
- `npm run server:status` - Check PM2 server status
- `npm run server:logs` - View PM2 server logs

## MCP Integration

### Quick Start for MCP

After installation, your MCP server is ready to use:

1. **Ensure PM2 server is running**: `npm run server:start`
2. **Add to your MCP configuration** (see configuration example below)
3. **The MCP server will automatically connect** when called by your MCP client

The PM2 server runs the web dashboard on port 3020, while the MCP server uses the configuration you specify in your MCP client.

### Adding to MCP Client Configuration

Add this server to your MCP client configuration file:

```json
{
  "servers": {
    "task-mcp": {
      "command": "node",
      "args": [
        "/Users/barryvelasquez/projects/minitask/dist/index.js",
        "--mcp"
      ],
      "timeout": 60000,
      "disabled": false,
      "alwaysAllow": [
        "list_tasks",
        "create_task",
        "get_task", 
        "update_task",
        "delete_task"
      ]
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
│   ├── index.ts                 # Main entry point with mode detection
│   ├── database.ts              # SQLite database layer
│   ├── mcp-server.ts            # MCP protocol implementation
│   ├── standalone-web-server.ts # PM2-managed web server
│   └── web-server.ts            # Express.js server with Socket.io
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main React application
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks  
│   │   ├── services/            # API service layer
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── index.html               # Frontend entry point
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── public/                      # Built frontend assets (generated)
├── dist/                        # Compiled TypeScript output (generated)
├── ecosystem.config.cjs         # PM2 configuration
├── tasks_notes.db              # SQLite database file (generated)
└── package.json                # Main project configuration
```

### API Endpoints

The web server exposes REST API endpoints that the MCP server uses:

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

### Build Process

The build process handles both frontend and backend:

1. **Frontend Build**: React app compiled with Vite to `/public`
2. **Backend Build**: TypeScript compiled to `/dist`
3. **PM2 Deployment**: Uses compiled `dist/standalone-web-server.js`

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

> "Add a task to buy groceries"

The LLM will use the `add_task` tool, which makes an HTTP POST to the web server's `/api/tasks` endpoint.

> "Save a note about the meeting agenda: discuss budget, review timeline, assign tasks"

The LLM will use the `add_note` tool, which makes an HTTP POST to the web server's `/api/notes` endpoint with Markdown content.

> "Find my notes about the budget"

The LLM will use the `search_notes` tool, which queries the web server's `/api/notes/search` endpoint.

## License

MIT License - feel free to use and modify as needed.
