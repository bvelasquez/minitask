import { Task, Note, TaskUpdate } from '../types';

const API_BASE = '/api';

class ApiService {
  // Tasks
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  }

  async createTask(description: string, order_index?: number): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, order_index }),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  }

  async updateTask(id: number, updates: TaskUpdate): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }

  async deleteTask(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  }

  async reorderTasks(taskIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: taskIds }),
    });
    if (!response.ok) throw new Error('Failed to reorder tasks');
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    const response = await fetch(`${API_BASE}/notes`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }

  async createNote(content: string): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to create note');
    return response.json();
  }

  async updateNote(id: number, content: string): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to update note');
    return response.json();
  }

  async deleteNote(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete note');
  }

  async searchNotes(query: string): Promise<Note[]> {
    const response = await fetch(`${API_BASE}/notes/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search notes');
    return response.json();
  }

  async renderMarkdown(content: string): Promise<string> {
    const response = await fetch(`${API_BASE}/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to render markdown');
    const result = await response.json();
    return result.html;
  }
}

export const apiService = new ApiService();