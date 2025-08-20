import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export interface Task {
  id: number;
  description: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = './tasks_notes.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private async initializeTables(): Promise<void> {
    try {
      console.log('[DEBUG] Database.initializeTables - Creating tables and indexes');
      
      // Create tasks table
      await new Promise<void>((resolve, reject) => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            order_index INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Create notes table
      await new Promise<void>((resolve, reject) => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Create indexes
      await new Promise<void>((resolve, reject) => {
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index)`, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC)`, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('[DEBUG] Database.initializeTables - Tables and indexes created successfully');
    } catch (error) {
      console.error('[ERROR] Database.initializeTables failed:', error);
      throw error;
    }
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    const all = promisify(this.db.all.bind(this.db)) as (sql: string) => Promise<any[]>;
    const rows = await all('SELECT * FROM tasks ORDER BY order_index ASC, created_at ASC');
    
    // Convert SQLite integer boolean to actual boolean
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed)
    }));
  }

  async addTask(description: string, orderIndex?: number): Promise<Task> {
    const get = promisify(this.db.get.bind(this.db)) as (sql: string, params?: any[]) => Promise<Task>;
    
    try {
      console.log(`[DEBUG] Database.addTask - Description: "${description}", OrderIndex: ${orderIndex}`);
      
      if (orderIndex === undefined) {
        const maxOrder = await get('SELECT MAX(order_index) as max_order FROM tasks') as any;
        orderIndex = (maxOrder?.max_order || 0) + 1;
        console.log(`[DEBUG] Database.addTask - Calculated orderIndex: ${orderIndex}`);
      }
      
      // Use a Promise wrapper for the run method to properly capture the result
      const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
        this.db.run(
          'INSERT INTO tasks (description, order_index) VALUES (?, ?)',
          [description, orderIndex],
          function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              reject(err);
            } else {
              resolve(this);
            }
          }
        );
      });
      
      console.log(`[DEBUG] Database.addTask - Insert result:`, result);
      console.log(`[DEBUG] Database.addTask - lastID:`, result.lastID);
      
      const newTask = await get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
      console.log(`[DEBUG] Database.addTask - Created task:`, newTask);
      
      // Convert SQLite integer boolean to actual boolean
      if (newTask) {
        newTask.completed = Boolean(newTask.completed);
      }
      
      return newTask;
    } catch (error) {
      console.error(`[ERROR] Database.addTask failed:`, error);
      console.error(`[ERROR] Database.addTask - Description: "${description}", OrderIndex: ${orderIndex}`);
      throw error;
    }
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task | null> {
    const get = promisify(this.db.get.bind(this.db)) as (sql: string, params?: any[]) => Promise<Task | undefined>;
    
    try {
      console.log(`[DEBUG] Database.updateTask - ID: ${id}, Updates:`, updates);
      
      if (Object.keys(updates).length === 0) {
        console.log('[DEBUG] Database.updateTask - No updates provided');
        return await get('SELECT * FROM tasks WHERE id = ?', [id]) || null;
      }
      
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      const sql = `UPDATE tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      console.log(`[DEBUG] Database.updateTask - SQL: ${sql}`);
      console.log(`[DEBUG] Database.updateTask - Values:`, [...values, id]);
      
      // Use a Promise wrapper for the run method
      const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
        this.db.run(sql, [...values, id], function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });
      
      console.log(`[DEBUG] Database.updateTask - Update result:`, result);
      console.log(`[DEBUG] Database.updateTask - Changes:`, result.changes);
      
      const updatedTask = await get('SELECT * FROM tasks WHERE id = ?', [id]);
      console.log(`[DEBUG] Database.updateTask - Updated task:`, updatedTask);
      
      if (updatedTask) {
        // Convert SQLite integer boolean to actual boolean
        updatedTask.completed = Boolean(updatedTask.completed);
      }
      
      return updatedTask || null;
    } catch (error) {
      console.error(`[ERROR] Database.updateTask failed for ID ${id}:`, error);
      console.error(`[ERROR] Database.updateTask - Updates were:`, updates);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    try {
      console.log(`[DEBUG] Database.deleteTask - Deleting task ID: ${id}`);
      
      // Use a Promise wrapper for the run method
      const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
        this.db.run('DELETE FROM tasks WHERE id = ?', [id], function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });
      
      console.log(`[DEBUG] Database.deleteTask - Delete result:`, result);
      console.log(`[DEBUG] Database.deleteTask - Changes:`, result.changes);
      
      return (result.changes || 0) > 0;
    } catch (error) {
      console.error(`[ERROR] Database.deleteTask failed for ID ${id}:`, error);
      throw error;
    }
  }

  async reorderTasks(taskIds: number[]): Promise<void> {
    try {
      console.log(`[DEBUG] Database.reorderTasks - Task IDs:`, taskIds);
      
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        const newOrder = i + 1;
        
        console.log(`[DEBUG] Database.reorderTasks - Setting task ${taskId} to order ${newOrder}`);
        
        // Use a Promise wrapper for the run method
        const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
          this.db.run(
            'UPDATE tasks SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newOrder, taskId],
            function(this: sqlite3.RunResult, err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve(this);
              }
            }
          );
        });
        
        console.log(`[DEBUG] Database.reorderTasks - Update result for task ${taskId}:`, result);
        console.log(`[DEBUG] Database.reorderTasks - Changes for task ${taskId}:`, result.changes);
        
        if (result.changes === 0) {
          console.warn(`[WARN] Database.reorderTasks - No task found with ID ${taskId}`);
        }
      }
      
      console.log(`[DEBUG] Database.reorderTasks - Completed reordering ${taskIds.length} tasks`);
    } catch (error) {
      console.error(`[ERROR] Database.reorderTasks failed:`, error);
      console.error(`[ERROR] Database.reorderTasks - Task IDs were:`, taskIds);
      throw error;
    }
  }

  // Note methods
  async getNotes(): Promise<Note[]> {
    const all = promisify(this.db.all.bind(this.db)) as (sql: string) => Promise<Note[]>;
    return await all('SELECT * FROM notes ORDER BY created_at DESC');
  }

  async addNote(content: string): Promise<Note> {
    const get = promisify(this.db.get.bind(this.db)) as (sql: string, params?: any[]) => Promise<Note>;
    
    try {
      console.log(`[DEBUG] Database.addNote - Content length: ${content.length}`);
      
      // Use a Promise wrapper for the run method
      const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
        this.db.run('INSERT INTO notes (content) VALUES (?)', [content], function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });
      
      console.log(`[DEBUG] Database.addNote - Insert result:`, result);
      console.log(`[DEBUG] Database.addNote - lastID:`, result.lastID);
      
      const newNote = await get('SELECT * FROM notes WHERE id = ?', [result.lastID]);
      console.log(`[DEBUG] Database.addNote - Created note:`, newNote);
      
      return newNote;
    } catch (error) {
      console.error(`[ERROR] Database.addNote failed:`, error);
      throw error;
    }
  }

  async updateNote(id: number, content: string): Promise<Note | null> {
    const get = promisify(this.db.get.bind(this.db)) as (sql: string, params?: any[]) => Promise<Note | undefined>;
    
    try {
      console.log(`[DEBUG] Database.updateNote - ID: ${id}, Content length: ${content.length}`);
      
      // Use a Promise wrapper for the run method
      const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
        this.db.run(
          'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [content, id],
          function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              reject(err);
            } else {
              resolve(this);
            }
          }
        );
      });
      
      console.log(`[DEBUG] Database.updateNote - Update result:`, result);
      console.log(`[DEBUG] Database.updateNote - Changes:`, result.changes);
      
      const updatedNote = await get('SELECT * FROM notes WHERE id = ?', [id]);
      console.log(`[DEBUG] Database.updateNote - Updated note:`, updatedNote);
      
      return updatedNote || null;
    } catch (error) {
      console.error(`[ERROR] Database.updateNote failed for ID ${id}:`, error);
      throw error;
    }
  }

  async deleteNote(id: number): Promise<boolean> {
    try {
      console.log(`[DEBUG] Database.deleteNote - Deleting note ID: ${id}`);
      
      // Use a Promise wrapper for the run method
      const result = await new Promise<sqlite3.RunResult>((resolve, reject) => {
        this.db.run('DELETE FROM notes WHERE id = ?', [id], function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      });
      
      console.log(`[DEBUG] Database.deleteNote - Delete result:`, result);
      console.log(`[DEBUG] Database.deleteNote - Changes:`, result.changes);
      
      return (result.changes || 0) > 0;
    } catch (error) {
      console.error(`[ERROR] Database.deleteNote failed for ID ${id}:`, error);
      throw error;
    }
  }

  async searchNotes(query: string): Promise<Note[]> {
    const all = promisify(this.db.all.bind(this.db)) as (sql: string, params?: any[]) => Promise<Note[]>;
    return await all(
      'SELECT * FROM notes WHERE content LIKE ? ORDER BY created_at DESC',
      [`%${query}%`]
    );
  }

  close(): void {
    this.db.close();
  }
}
