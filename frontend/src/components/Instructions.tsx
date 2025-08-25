import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Settings, Play, Code, BookOpen } from 'lucide-react';

export const Instructions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'setup', title: 'MCP Setup', icon: Settings },
    { id: 'usage', title: 'Usage', icon: Play },
    { id: 'development', title: 'Development', icon: Code },
  ];

  return (
    <div className="instructions-container">
      <button
        className="instructions-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Terminal size={16} />
        <span>Setup & Usage Instructions</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="instructions-content">
          <div className="instructions-nav">
            {sections.map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                className={`instructions-nav-item ${
                  activeSection === id ? "active" : ""
                }`}
                onClick={() => setActiveSection(id)}
              >
                <Icon size={14} />
                {title}
              </button>
            ))}
          </div>

          <div className="instructions-body">
            {activeSection === "overview" && (
              <div className="instructions-section">
                <h3>Task & Notes MCP Server</h3>
                <p>
                  A modern MCP (Model Context Protocol) server for task and
                  notes management with an integrated web dashboard. This server
                  allows LLMs to manage tasks and notes while providing a clean
                  web interface for human interaction.
                </p>

                <h4>Features</h4>
                <ul>
                  <li>
                    <strong>Task Management:</strong> Add, update, delete,
                    reorder, and list tasks
                  </li>
                  <li>
                    <strong>Notes Management:</strong> Add, update, delete,
                    search, and list notes with Markdown support
                  </li>
                  <li>
                    <strong>Mermaid Diagrams:</strong> Full support for Mermaid
                    diagrams in notes
                  </li>
                  <li>
                    <strong>Persistent Storage:</strong> SQLite database for
                    reliable data persistence
                  </li>
                  <li>
                    <strong>Real-time Updates:</strong> WebSocket integration
                    for live updates
                  </li>
                  <li>
                    <strong>Dark Mode:</strong> Automatic theme detection and
                    switching
                  </li>
                </ul>
              </div>
            )}

            {activeSection === "setup" && (
              <div className="instructions-section">
                <h3>MCP Server Setup</h3>

                <h4>1. Installation</h4>
                <div className="code-block">
                  <pre>
                    <code>{`# Clone or navigate to project directory
cd /path/to/task-notes-mcp-server

# Install dependencies (includes frontend dependencies)
npm install

# Build both frontend and backend
npm run build`}</code>
                  </pre>
                </div>

                <h4>2. MCP Client Configuration</h4>
                <p>
                  Add this server to your MCP client configuration (e.g.,{" "}
                  <code>mcp-config.json</code>):
                </p>
                <div className="code-block">
                  <pre>
                    <code>{`{
  "mcpServers": {
    "task-notes": {
      "command": "node",
      "args": ["/dist/index.js", "--mcp"],
      "timeout": 120000,
      "disabled": false
    }
  }
}`}</code>
                  </pre>
                </div>
                <p>
                  <strong>Note:</strong> Make sure to run this from the project
                  directory, or update <code>cwd</code> to the full path to your
                  project.
                </p>

                <h4>3. Available MCP Tools</h4>
                <div className="tools-grid">
                  <div className="tool-category">
                    <h5>Task Management</h5>
                    <ul>
                      <li>
                        <code>list_tasks</code> - Get all tasks
                      </li>
                      <li>
                        <code>add_task</code> - Create a new task
                      </li>
                      <li>
                        <code>update_task</code> - Modify task
                      </li>
                      <li>
                        <code>delete_task</code> - Remove task
                      </li>
                      <li>
                        <code>reorder_tasks</code> - Reorganize tasks
                      </li>
                    </ul>
                  </div>
                  <div className="tool-category">
                    <h5>Notes Management</h5>
                    <ul>
                      <li>
                        <code>list_notes</code> - Get all notes
                      </li>
                      <li>
                        <code>add_note</code> - Create a new note
                      </li>
                      <li>
                        <code>update_note</code> - Edit note content
                      </li>
                      <li>
                        <code>delete_note</code> - Remove note
                      </li>
                      <li>
                        <code>search_notes</code> - Find notes by text
                      </li>
                    </ul>
                  </div>
                  <div className="tool-category">
                    <h5>Server Management</h5>
                    <ul>
                      <li>
                        <code>restart_server</code> - Restart web server
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "usage" && (
              <div className="instructions-section">
                <h3>Usage Instructions</h3>

                <h4>Web Dashboard Mode (Default)</h4>
                <div className="code-block">
                  <pre>
                    <code>{`# Start with integrated web dashboard
npm start

# Development mode with auto-reload (backend only)
npm run dev

# Development mode for frontend (separate terminal)
npm run dev:frontend`}</code>
                  </pre>
                </div>
                <p>
                  The dashboard will automatically open at{" "}
                  <code>http://localhost:3020/dashboard</code>
                </p>

                <h4>PM2 Server Management</h4>
                <div className="code-block">
                  <pre>
                    <code>{`# Start server with PM2 (persistent)
npm run server:start

# Check server status
npm run server:status

# View server logs
npm run server:logs

# Restart server
npm run server:restart

# Stop server
npm run server:stop`}</code>
                  </pre>
                </div>

                <h4>MCP Server Mode</h4>
                <div className="code-block">
                  <pre>
                    <code>{`# Run as MCP server for LLM integration
npm run build
node dist/index.js --mcp

# Or set environment variable
NODE_ENV=mcp npm start`}</code>
                  </pre>
                </div>

                <h4>Example LLM Interactions</h4>
                <div className="example-interactions">
                  <div className="interaction-example">
                    <h5>Adding Tasks</h5>
                    <p>
                      <em>"Add a task to buy groceries"</em>
                    </p>
                    <p>
                      → Uses <code>add_task</code> tool with description "Buy
                      groceries"
                    </p>
                  </div>

                  <div className="interaction-example">
                    <h5>Managing Notes with Diagrams</h5>
                    <p>
                      <em>
                        "Save a note about the system architecture with a
                        flowchart"
                      </em>
                    </p>
                    <p>
                      → Uses <code>add_note</code> tool with Markdown content
                      including Mermaid diagrams
                    </p>
                  </div>

                  <div className="interaction-example">
                    <h5>Searching Information</h5>
                    <p>
                      <em>"Find my notes about the budget"</em>
                    </p>
                    <p>
                      → Uses <code>search_notes</code> tool with query "budget"
                    </p>
                  </div>

                  <div className="interaction-example">
                    <h5>Server Management</h5>
                    <p>
                      <em>
                        "Restart the web server after I made some changes"
                      </em>
                    </p>
                    <p>
                      → Uses <code>restart_server</code> tool to restart the
                      PM2-managed server
                    </p>
                  </div>
                </div>

                <h4>Markdown & Mermaid Support</h4>
                <p>Notes support full Markdown syntax plus Mermaid diagrams:</p>
                <div className="code-block">
                  <pre>
                    <code>{`# My Note with Diagram

Regular **markdown** content works great.

\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

- Lists work too
- With proper formatting`}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeSection === "development" && (
              <div className="instructions-section">
                <h3>Development</h3>

                <h4>Project Structure</h4>
                <div className="code-block">
                  <pre>
                    <code>{`├── src/
│   ├── index.ts          # Main entry point
│   ├── database.ts       # SQLite database layer
│   ├── mcp-server.ts     # MCP protocol implementation
│   └── web-server.ts     # Express web server
├── frontend/             # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── public/               # Built frontend assets
├── dist/                 # Compiled TypeScript output
├── ecosystem.config.cjs  # PM2 configuration
├── mcp-config.json      # MCP client configuration
└── tasks_notes.db       # SQLite database file`}</code>
                  </pre>
                </div>

                <h4>Available Scripts</h4>
                <div className="code-block">
                  <pre>
                    <code>{`# Build commands
npm run build              # Build both frontend and backend
npm run build:backend      # Build backend only (TypeScript)
npm run build:frontend     # Build frontend only (React/Vite)

# Development commands
npm run dev                # Backend development with auto-reload
npm run dev:frontend       # Frontend development server

# Server management
npm start                  # Start built server
npm run server:start       # Start with PM2 (persistent)
npm run server:stop        # Stop PM2 server
npm run server:restart     # Restart PM2 server
npm run server:status      # Check PM2 status
npm run server:logs        # View PM2 logs

# Utility commands
npm run clean              # Remove compiled files
npm run install:frontend   # Install frontend dependencies`}</code>
                  </pre>
                </div>

                <h4>API Endpoints</h4>
                <p>
                  The web server exposes REST API endpoints that mirror the MCP
                  tools:
                </p>
                <div className="api-endpoints">
                  <div className="endpoint-group">
                    <h5>Tasks</h5>
                    <ul>
                      <li>
                        <code>GET /api/tasks</code> - List all tasks
                      </li>
                      <li>
                        <code>POST /api/tasks</code> - Create new task
                      </li>
                      <li>
                        <code>PUT /api/tasks/:id</code> - Update task
                      </li>
                      <li>
                        <code>DELETE /api/tasks/:id</code> - Delete task
                      </li>
                      <li>
                        <code>POST /api/tasks/reorder</code> - Reorder tasks
                      </li>
                    </ul>
                  </div>
                  <div className="endpoint-group">
                    <h5>Notes</h5>
                    <ul>
                      <li>
                        <code>GET /api/notes</code> - List all notes
                      </li>
                      <li>
                        <code>POST /api/notes</code> - Create new note
                      </li>
                      <li>
                        <code>PUT /api/notes/:id</code> - Update note
                      </li>
                      <li>
                        <code>DELETE /api/notes/:id</code> - Delete note
                      </li>
                      <li>
                        <code>GET /api/notes/search?q=query</code> - Search
                        notes
                      </li>
                    </ul>
                  </div>
                  <div className="endpoint-group">
                    <h5>Server</h5>
                    <ul>
                      <li>
                        <code>POST /api/server/restart</code> - Restart server
                      </li>
                      <li>
                        <code>GET /dashboard</code> - Web dashboard
                      </li>
                      <li>
                        <code>WebSocket</code> - Real-time updates
                      </li>
                    </ul>
                  </div>
                </div>

                <h4>Development Workflow</h4>
                <div className="code-block">
                  <pre>
                    <code>{`# 1. Install dependencies
npm install

# 2. Start development servers (separate terminals)
npm run dev              # Backend with auto-reload
npm run dev:frontend     # Frontend dev server

# 3. Build for production
npm run build

# 4. Start production server
npm run server:start     # PM2 managed server`}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
