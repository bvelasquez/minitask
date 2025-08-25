import express from 'express';
import cors from 'cors';
import { marked } from 'marked';
import { Database } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import os from 'os';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BROWSER_LOCK_FILE = path.join(os.tmpdir(), 'task-notes-dashboard.lock');(__filename);

export class WebServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private db: Database;
  private port: number;

  constructor(db: Database, port: number = 3020) {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.db = db;
    this.port = port;
    this.setupMiddleware();
    this.setupWebSocket();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private setupWebSocket(): void {
    this.io.on("connection", (socket) => {
      console.log("[DEBUG] Client connected to WebSocket");

      socket.on("disconnect", () => {
        console.log("[DEBUG] Client disconnected from WebSocket");
      });
    });
  }

  private setupRoutes(): void {
    // API Routes

    // Tasks API
    this.app.get("/api/tasks", async (req, res) => {
      try {
        console.log("[DEBUG] GET /api/tasks - Fetching tasks");
        const tasks = await this.db.getTasks();
        console.log(`[DEBUG] GET /api/tasks - Found ${tasks.length} tasks`);
        res.json(tasks);
      } catch (error) {
        console.error("[ERROR] GET /api/tasks failed:", error);
        res.status(500).json({
          error: "Failed to fetch tasks",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    this.app.post("/api/tasks", async (req, res) => {
      try {
        console.log("[DEBUG] POST /api/tasks - Request body:", req.body);
        const { description, order_index } = req.body;

        if (!description || typeof description !== "string") {
          console.log(
            "[DEBUG] POST /api/tasks - Invalid description:",
            description,
          );
          return res
            .status(400)
            .json({ error: "Description is required and must be a string" });
        }

        const task = await this.db.addTask(description, order_index);
        console.log("[DEBUG] POST /api/tasks - Created task:", task);

        // Emit WebSocket event
        this.io.emit("taskAdded", task);

        res.json(task);
      } catch (error) {
        console.error("[ERROR] POST /api/tasks failed:", error);
        res.status(500).json({
          error: "Failed to create task",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    this.app.put("/api/tasks/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        console.log(`[DEBUG] PUT /api/tasks/${id} - Request body:`, updates);
        console.log(`[DEBUG] PUT /api/tasks/${id} - Parsed ID:`, id);

        if (isNaN(id)) {
          console.log(`[DEBUG] PUT /api/tasks/${req.params.id} - Invalid ID`);
          return res.status(400).json({ error: "Invalid task ID" });
        }

        // Validate updates object
        const allowedFields = ["description", "completed", "order_index"];
        const invalidFields = Object.keys(updates).filter(
          (key) => !allowedFields.includes(key),
        );
        if (invalidFields.length > 0) {
          console.log(
            `[DEBUG] PUT /api/tasks/${id} - Invalid fields:`,
            invalidFields,
          );
          return res.status(400).json({
            error: "Invalid fields in update",
            invalidFields,
            allowedFields,
          });
        }

        const task = await this.db.updateTask(id, updates);
        console.log(`[DEBUG] PUT /api/tasks/${id} - Updated task:`, task);

        if (!task) {
          console.log(`[DEBUG] PUT /api/tasks/${id} - Task not found`);
          return res.status(404).json({ error: "Task not found" });
        }

        // Emit WebSocket event
        this.io.emit("taskUpdated", task);

        res.json(task);
      } catch (error) {
        console.error(`[ERROR] PUT /api/tasks/${req.params.id} failed:`, error);
        res.status(500).json({
          error: "Failed to update task",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestBody: req.body,
          taskId: req.params.id,
        });
      }
    });

    this.app.delete("/api/tasks/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        console.log(`[DEBUG] DELETE /api/tasks/${id} - Deleting task`);

        if (isNaN(id)) {
          console.log(
            `[DEBUG] DELETE /api/tasks/${req.params.id} - Invalid ID`,
          );
          return res.status(400).json({ error: "Invalid task ID" });
        }

        const deleted = await this.db.deleteTask(id);
        console.log(
          `[DEBUG] DELETE /api/tasks/${id} - Deletion result:`,
          deleted,
        );

        if (!deleted) {
          console.log(`[DEBUG] DELETE /api/tasks/${id} - Task not found`);
          return res.status(404).json({ error: "Task not found" });
        }

        // Emit WebSocket event
        this.io.emit("taskDeleted", id);

        res.json({ success: true });
      } catch (error) {
        console.error(
          `[ERROR] DELETE /api/tasks/${req.params.id} failed:`,
          error,
        );
        res.status(500).json({
          error: "Failed to delete task",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          taskId: req.params.id,
        });
      }
    });

    this.app.post("/api/tasks/reorder", async (req, res) => {
      try {
        const { task_ids } = req.body;
        console.log(
          "[DEBUG] POST /api/tasks/reorder - Request body:",
          req.body,
        );

        if (!Array.isArray(task_ids)) {
          console.log(
            "[DEBUG] POST /api/tasks/reorder - Invalid task_ids:",
            task_ids,
          );
          return res.status(400).json({ error: "task_ids must be an array" });
        }

        if (task_ids.some((id) => typeof id !== "number" || isNaN(id))) {
          console.log(
            "[DEBUG] POST /api/tasks/reorder - Invalid IDs in array:",
            task_ids,
          );
          return res
            .status(400)
            .json({ error: "All task_ids must be valid numbers" });
        }

        await this.db.reorderTasks(task_ids);
        console.log("[DEBUG] POST /api/tasks/reorder - Reorder successful");

        // Emit WebSocket event
        this.io.emit("tasksReordered", task_ids);

        res.json({ success: true });
      } catch (error) {
        console.error("[ERROR] POST /api/tasks/reorder failed:", error);
        res.status(500).json({
          error: "Failed to reorder tasks",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestBody: req.body,
        });
      }
    });

    // Notes API
    this.app.get("/api/notes", async (req, res) => {
      try {
        console.log("[DEBUG] GET /api/notes - Fetching notes");
        const notes = await this.db.getNotes();
        console.log(`[DEBUG] GET /api/notes - Found ${notes.length} notes`);
        res.json(notes);
      } catch (error) {
        console.error("[ERROR] GET /api/notes failed:", error);
        res.status(500).json({
          error: "Failed to fetch notes",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    this.app.post("/api/notes", async (req, res) => {
      try {
        console.log("[DEBUG] POST /api/notes - Request body:", req.body);
        const { content } = req.body;

        if (!content || typeof content !== "string") {
          console.log("[DEBUG] POST /api/notes - Invalid content:", content);
          return res
            .status(400)
            .json({ error: "Content is required and must be a string" });
        }

        const note = await this.db.addNote(content);
        console.log("[DEBUG] POST /api/notes - Created note:", note);

        // Emit WebSocket event
        this.io.emit("noteAdded", note);

        res.json(note);
      } catch (error) {
        console.error("[ERROR] POST /api/notes failed:", error);
        res.status(500).json({
          error: "Failed to create note",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    this.app.put("/api/notes/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { content } = req.body;

        console.log(`[DEBUG] PUT /api/notes/${id} - Request body:`, req.body);
        console.log(`[DEBUG] PUT /api/notes/${id} - Parsed ID:`, id);

        if (isNaN(id)) {
          console.log(`[DEBUG] PUT /api/notes/${req.params.id} - Invalid ID`);
          return res.status(400).json({ error: "Invalid note ID" });
        }

        if (!content || typeof content !== "string") {
          console.log(
            `[DEBUG] PUT /api/notes/${id} - Invalid content:`,
            content,
          );
          return res
            .status(400)
            .json({ error: "Content is required and must be a string" });
        }

        const note = await this.db.updateNote(id, content);
        console.log(`[DEBUG] PUT /api/notes/${id} - Updated note:`, note);

        if (!note) {
          console.log(`[DEBUG] PUT /api/notes/${id} - Note not found`);
          return res.status(404).json({ error: "Note not found" });
        }

        // Emit WebSocket event
        this.io.emit("noteUpdated", note);

        res.json(note);
      } catch (error) {
        console.error(`[ERROR] PUT /api/notes/${req.params.id} failed:`, error);
        res.status(500).json({
          error: "Failed to update note",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestBody: req.body,
          noteId: req.params.id,
        });
      }
    });

    this.app.delete("/api/notes/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        console.log(`[DEBUG] DELETE /api/notes/${id} - Deleting note`);

        if (isNaN(id)) {
          console.log(
            `[DEBUG] DELETE /api/notes/${req.params.id} - Invalid ID`,
          );
          return res.status(400).json({ error: "Invalid note ID" });
        }

        const deleted = await this.db.deleteNote(id);
        console.log(
          `[DEBUG] DELETE /api/notes/${id} - Deletion result:`,
          deleted,
        );

        if (!deleted) {
          console.log(`[DEBUG] DELETE /api/notes/${id} - Note not found`);
          return res.status(404).json({ error: "Note not found" });
        }

        // Emit WebSocket event
        this.io.emit("noteDeleted", id);

        res.json({ success: true });
      } catch (error) {
        console.error(
          `[ERROR] DELETE /api/notes/${req.params.id} failed:`,
          error,
        );
        res.status(500).json({
          error: "Failed to delete note",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          noteId: req.params.id,
        });
      }
    });

    this.app.get("/api/notes/search", async (req, res) => {
      try {
        const query = req.query.q as string;
        console.log("[DEBUG] GET /api/notes/search - Query:", query);

        if (!query) {
          console.log(
            "[DEBUG] GET /api/notes/search - Missing query parameter",
          );
          return res.status(400).json({ error: "Query parameter required" });
        }

        const notes = await this.db.searchNotes(query);
        console.log(
          `[DEBUG] GET /api/notes/search - Found ${notes.length} notes`,
        );
        res.json(notes);
      } catch (error) {
        console.error("[ERROR] GET /api/notes/search failed:", error);
        res.status(500).json({
          error: "Failed to search notes",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          query: req.query.q,
        });
      }
    });

    // Markdown rendering endpoint
    this.app.post("/api/markdown", async (req, res) => {
      try {
        console.log("[DEBUG] POST /api/markdown - Request body:", req.body);
        const { content } = req.body;

        if (!content || typeof content !== "string") {
          console.log("[DEBUG] POST /api/markdown - Invalid content:", content);
          return res
            .status(400)
            .json({ error: "Content is required and must be a string" });
        }

        const html = await marked(content);
        console.log(
          "[DEBUG] POST /api/markdown - Rendered HTML length:",
          html.length,
        );
        res.json({ html });
      } catch (error) {
        console.error("[ERROR] POST /api/markdown failed:", error);
        res.status(500).json({
          error: "Failed to render markdown",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    // Serve React app for all non-API routes (SPA fallback)
    this.app.get("*", (req, res) => {
      // Skip API routes
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      console.log(`[DEBUG] GET ${req.path} - Serving React app`);
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    // Global error handler
    this.app.use(
      (
        error: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        console.error("[ERROR] Unhandled error:", error);
        console.error("[ERROR] Request details:", {
          method: req.method,
          url: req.url,
          body: req.body,
          params: req.params,
          query: req.query,
        });

        if (!res.headersSent) {
          res.status(500).json({
            error: "Internal server error",
            details: error.message,
            stack: error.stack,
            request: {
              method: req.method,
              url: req.url,
              body: req.body,
            },
          });
        }
      },
    );
  }

  private async isDashboardAlreadyOpen(): Promise<boolean> {
    try {
      if (!fs.existsSync(BROWSER_LOCK_FILE)) {
        return false;
      }

      // Read the lock file to get the timestamp and PID
      const lockContent = fs.readFileSync(BROWSER_LOCK_FILE, "utf8");
      const [lockTimeStr, pidStr] = lockContent.split(":");
      const lockTime = parseInt(lockTimeStr);
      const pid = pidStr ? parseInt(pidStr) : null;

      // If lock file is older than 1 hour, consider it stale
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      if (lockTime < oneHourAgo) {
        fs.unlinkSync(BROWSER_LOCK_FILE);
        return false;
      }

      // If we have a PID, check if the process is still running
      if (pid) {
        try {
          // On Unix systems, sending signal 0 checks if process exists without killing it
          process.kill(pid, 0);
          return true; // Process is still running
        } catch (error) {
          // Process is not running, remove stale lock file
          fs.unlinkSync(BROWSER_LOCK_FILE);
          return false;
        }
      }

      return true;
    } catch (error) {
      // If there's any error reading the lock file, assume dashboard is not open
      return false;
    }
  }

  private async markDashboardAsOpen(): Promise<void> {
    try {
      // Store timestamp and current process PID (web server PID, not MCP PID)
      const lockData = `${Date.now()}:${process.pid}`;
      fs.writeFileSync(BROWSER_LOCK_FILE, lockData);
    } catch (error) {
      console.error("Warning: Could not create browser lock file:", error);
    }
  }

  async openDashboardIfNeeded(force: boolean = false): Promise<void> {
    if (!force) {
      const alreadyOpen = await this.isDashboardAlreadyOpen();

      if (alreadyOpen) {
        console.log("Dashboard appears to already be open in browser");
        console.log(
          `If not visible, please visit: http://localhost:${this.port}`,
        );
        return;
      }
    }

    try {
      await this.markDashboardAsOpen(); // Create lock file before opening browser
      await open(`http://localhost:${this.port}`);
      console.log("Dashboard opened in your default browser");
    } catch (error) {
      console.log(
        `Could not auto-open browser. Please visit: http://localhost:${this.port}`,
      );
    }
  }

  cleanupLockFile(): void {
    try {
      if (fs.existsSync(BROWSER_LOCK_FILE)) {
        fs.unlinkSync(BROWSER_LOCK_FILE);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, async () => {
        console.log(`Dashboard available at: http://localhost:${this.port}`);

        // Create lock file when web server starts
        await this.markDashboardAsOpen();

        // Set up cleanup on process termination
        const cleanup = () => {
          console.log("Cleaning up browser lock file...");
          this.cleanupLockFile();
        };

        process.on("SIGINT", cleanup);
        process.on("SIGTERM", cleanup);
        process.on("exit", cleanup);

        resolve();
      });
    });
  }
}
