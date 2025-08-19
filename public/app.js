class TaskNotesApp {
    constructor() {
        this.tasks = [];
        this.notes = [];
        this.editingNoteId = null;
        this.socket = null;
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.bindEvents();
        this.loadTasks();
        this.loadNotes();
    }

    setupWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        this.socket.on('taskAdded', (task) => {
            console.log('Task added via WebSocket:', task);
            this.tasks.push(task);
            this.renderTasks();
        });

        this.socket.on('taskUpdated', (updatedTask) => {
            console.log('Task updated via WebSocket:', updatedTask);
            const index = this.tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
                this.tasks[index] = updatedTask;
                this.renderTasks();
            }
        });

        this.socket.on('taskDeleted', (taskId) => {
            console.log('Task deleted via WebSocket:', taskId);
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
        });

        this.socket.on('tasksReordered', (taskIds) => {
            console.log('Tasks reordered via WebSocket:', taskIds);
            this.loadTasks(); // Reload to get correct order
        });

        this.socket.on('noteAdded', (note) => {
            console.log('Note added via WebSocket:', note);
            this.notes.unshift(note); // Add to beginning since notes are in reverse chronological order
            this.renderNotes();
        });

        this.socket.on('noteUpdated', (updatedNote) => {
            console.log('Note updated via WebSocket:', updatedNote);
            const index = this.notes.findIndex(n => n.id === updatedNote.id);
            if (index !== -1) {
                this.notes[index] = updatedNote;
                this.renderNotes();
            }
        });

        this.socket.on('noteDeleted', (noteId) => {
            console.log('Note deleted via WebSocket:', noteId);
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.renderNotes();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
        });
    }

    bindEvents() {
        // Task events
        document.getElementById('add-task-btn').addEventListener('click', () => this.showTaskInput());
        document.getElementById('save-task-btn').addEventListener('click', () => this.saveTask());
        document.getElementById('cancel-task-btn').addEventListener('click', () => this.hideTaskInput());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveTask();
            if (e.key === 'Escape') this.hideTaskInput();
        });

        // Note events
        document.getElementById('add-note-btn').addEventListener('click', () => this.showNoteInput());
        document.getElementById('save-note-btn').addEventListener('click', () => this.saveNote());
        document.getElementById('cancel-note-btn').addEventListener('click', () => this.hideNoteInput());
        document.getElementById('notes-search').addEventListener('input', (e) => this.searchNotes(e.target.value));

        // Modal events
        document.getElementById('close-edit-modal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('update-note-btn').addEventListener('click', () => this.updateNote());
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.closeEditModal());

        // Close modal on outside click
        document.getElementById('edit-note-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-note-modal') this.closeEditModal();
        });
    }

    // Task methods
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            this.tasks = await response.json();
            this.renderTasks();
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showError('Failed to load tasks');
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks yet. Add your first task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}" draggable="true">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="app.toggleTask(${task.id}, this.checked)">
                <div class="task-content">
                    <div class="task-description ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.description)}</div>
                    <div class="task-meta">Created: ${this.formatDate(task.created_at)}</div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-danger btn-small" onclick="app.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.setupTaskDragAndDrop();
    }

    setupTaskDragAndDrop() {
        const taskItems = document.querySelectorAll('.task-item');
        const container = document.getElementById('tasks-container');

        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.taskId);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                container.classList.remove('drag-over');
            });
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
            const dropTarget = e.target.closest('.task-item');
            
            if (dropTarget && dropTarget.dataset.taskId !== draggedId.toString()) {
                this.reorderTasks(draggedId, parseInt(dropTarget.dataset.taskId));
            }
        });
    }

    showTaskInput() {
        document.getElementById('task-input-container').style.display = 'block';
        document.getElementById('task-input').focus();
    }

    hideTaskInput() {
        document.getElementById('task-input-container').style.display = 'none';
        document.getElementById('task-input').value = '';
    }

    async saveTask() {
        const input = document.getElementById('task-input');
        const description = input.value.trim();
        
        if (!description) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            if (response.ok) {
                this.hideTaskInput();
                // WebSocket will handle the update via 'taskAdded' event
            } else {
                this.showError('Failed to save task');
            }
        } catch (error) {
            console.error('Failed to save task:', error);
            this.showError('Failed to save task');
        }
    }

    async toggleTask(id, completed) {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });

            if (response.ok) {
                // WebSocket will handle the update via 'taskUpdated' event
            } else {
                this.showError('Failed to update task');
            }
        } catch (error) {
            console.error('Failed to update task:', error);
            this.showError('Failed to update task');
        }
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            
            if (response.ok) {
                // WebSocket will handle the update via 'taskDeleted' event
            } else {
                this.showError('Failed to delete task');
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            this.showError('Failed to delete task');
        }
    }

    async reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        // Reorder locally first for immediate feedback
        const [draggedTask] = this.tasks.splice(draggedIndex, 1);
        this.tasks.splice(targetIndex, 0, draggedTask);
        
        const taskIds = this.tasks.map(t => t.id);
        
        try {
            const response = await fetch('/api/tasks/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_ids: taskIds })
            });

            if (response.ok) {
                this.loadTasks(); // Reload to get updated order_index values
            } else {
                this.showError('Failed to reorder tasks');
                this.loadTasks(); // Reload original order
            }
        } catch (error) {
            console.error('Failed to reorder tasks:', error);
            this.showError('Failed to reorder tasks');
            this.loadTasks(); // Reload original order
        }
    }

    // Note methods
    async loadNotes() {
        try {
            const response = await fetch('/api/notes');
            this.notes = await response.json();
            this.renderNotes();
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.showError('Failed to load notes');
        }
    }

    async renderNotes(notesToRender = this.notes) {
        const container = document.getElementById('notes-container');
        
        if (notesToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <p>No notes yet. Add your first note to get started!</p>
                </div>
            `;
            return;
        }

        const renderedNotes = await Promise.all(notesToRender.map(async note => {
            const html = await this.renderMarkdown(note.content);
            return `
                <div class="note-item" data-note-id="${note.id}">
                    <div class="note-header">
                        <div class="note-date">${this.formatDate(note.created_at)}</div>
                        <div class="note-actions">
                            <button class="btn btn-primary btn-small" onclick="app.editNote(${note.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-small" onclick="app.deleteNote(${note.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="note-content">${html}</div>
                </div>
            `;
        }));

        container.innerHTML = renderedNotes.join('');
    }

    showNoteInput() {
        document.getElementById('note-input-container').style.display = 'block';
        document.getElementById('note-input').focus();
    }

    hideNoteInput() {
        document.getElementById('note-input-container').style.display = 'none';
        document.getElementById('note-input').value = '';
    }

    async saveNote() {
        const input = document.getElementById('note-input');
        const content = input.value.trim();
        
        if (!content) return;

        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                this.hideNoteInput();
                // WebSocket will handle the update via 'noteAdded' event
            } else {
                this.showError('Failed to save note');
            }
        } catch (error) {
            console.error('Failed to save note:', error);
            this.showError('Failed to save note');
        }
    }

    editNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.editingNoteId = id;
        document.getElementById('edit-note-content').value = note.content;
        document.getElementById('edit-note-modal').style.display = 'flex';
    }

    closeEditModal() {
        document.getElementById('edit-note-modal').style.display = 'none';
        this.editingNoteId = null;
    }

    async updateNote() {
        if (!this.editingNoteId) return;

        const content = document.getElementById('edit-note-content').value.trim();
        if (!content) return;

        try {
            const response = await fetch(`/api/notes/${this.editingNoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                this.closeEditModal();
                // WebSocket will handle the update via 'noteUpdated' event
            } else {
                this.showError('Failed to update note');
            }
        } catch (error) {
            console.error('Failed to update note:', error);
            this.showError('Failed to update note');
        }
    }

    async deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const response = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
            
            if (response.ok) {
                // WebSocket will handle the update via 'noteDeleted' event
            } else {
                this.showError('Failed to delete note');
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
            this.showError('Failed to delete note');
        }
    }

    async searchNotes(query) {
        if (!query.trim()) {
            this.renderNotes();
            return;
        }

        try {
            const response = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
            const searchResults = await response.json();
            this.renderNotes(searchResults);
        } catch (error) {
            console.error('Failed to search notes:', error);
            this.showError('Failed to search notes');
        }
    }

    // Utility methods
    async renderMarkdown(content) {
        try {
            const response = await fetch('/api/markdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            const result = await response.json();
            return result.html;
        } catch (error) {
            console.error('Failed to render markdown:', error);
            return this.escapeHtml(content);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // Simple error display - you could enhance this with a proper notification system
        alert(message);
    }
}

// Initialize the app
const app = new TaskNotesApp();
