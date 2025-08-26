import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit, Copy, Download, Bot } from 'lucide-react';
import { Task } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onUpdateDescription: (id: number, description: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdateDescription }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.description);
  const inputRef = useRef<HTMLTextAreaElement>(null);



  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update edit value when task description changes (from WebSocket updates)
  useEffect(() => {
    setEditValue(task.description);
  }, [task.description]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== task.description) {
      onUpdateDescription(task.id, trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(task.description);
    setIsEditing(false);
  };

  const handleCopyMarkdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(task.description);
      // Add visual feedback
      const button = e.currentTarget as HTMLButtonElement;
      button.classList.add('success-flash');
      setTimeout(() => button.classList.remove('success-flash'), 600);
      console.log('Task markdown copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = task.description;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleDownloadMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const blob = new Blob([task.description], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-${task.id}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateAIPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const aiPrompt = `I need help with a task from my task management system. Please use the MCP (Model Context Protocol) tools to find and work on this task.

**Task Information:**
- Task ID: ${task.id}
- Created: ${formatDate(task.created_at)}
- Status: ${task.completed ? 'Completed' : 'Pending'}
- Description: ${task.description}

**Instructions:**
1. Use the \`list_tasks\` MCP tool to see all current tasks
2. Use the \`update_task\` MCP tool if you need to modify the task (mark complete, update description, etc.)
3. If this task requires code changes, file operations, or other work, please help me complete it
4. If you need more context about the task or project, feel free to ask questions

**Available MCP Tools:**
- \`list_tasks\` - Get all tasks with completion status and metadata
- \`add_task\` - Create a new task
- \`update_task\` - Modify task description, completion status, or order
- \`delete_task\` - Remove a task permanently
- \`reorder_tasks\` - Reorganize multiple tasks by ID sequence

Please help me work on this task. If you can complete it or make progress, please update the task status accordingly using the MCP tools.`;

    try {
      await navigator.clipboard.writeText(aiPrompt);
      // Add visual feedback
      const button = e.currentTarget as HTMLButtonElement;
      button.classList.add('success-flash');
      setTimeout(() => button.classList.remove('success-flash'), 600);
      console.log('AI prompt copied to clipboard');
    } catch (err) {
      console.error('Failed to copy AI prompt to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = aiPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    // Prevent drag from starting when clicking on input
    e.stopPropagation();
  };

  const handleActionsClick = (e: React.MouseEvent) => {
    // Prevent drag from starting when clicking on actions
    e.stopPropagation();
  };

  // Create drag listeners that exclude the edit area and actions
  const dragListeners = isEditing ? {} : listeners;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item ${isDragging ? 'dragging' : ''} ${isEditing ? 'editing' : ''}`}
      {...attributes}
    >
      {/* Checkbox outside drag area to prevent event interference */}
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={(e) => {
          console.log('[DEBUG] Checkbox changed for task', task.id, 'checked:', e.target.checked);
          e.stopPropagation();
          onToggle(task.id, e.target.checked);
        }}
      />
      {/* Drag handle area - only the content area should be draggable */}
      <div className="task-drag-handle" {...dragListeners}>
        <div className="task-content">
          {isEditing ? (
            <div className="task-edit-container">
              <textarea
                ref={inputRef}
                className="task-edit-input task-textarea"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={handleInputClick}
                onBlur={handleSaveEdit}
                rows={Math.max(2, editValue.split('\n').length)}
              />
            </div>
          ) : (
            <div 
              className={`task-description ${task.completed ? 'completed' : ''}`}
            >
              <MarkdownRenderer content={task.description} />
            </div>
          )}
          <div className="task-meta">
            Created: {formatDate(task.created_at)}
          </div>
        </div>
      </div>
      <div className="task-actions" onClick={handleActionsClick}>
        <button
          className="btn btn-secondary btn-small btn-icon"
          onClick={handleCopyMarkdown}
          title="Copy markdown to clipboard"
        >
          <Copy size={14} />
        </button>
        <button
          className="btn btn-secondary btn-small btn-icon"
          onClick={handleDownloadMarkdown}
          title="Download as markdown file"
        >
          <Download size={14} />
        </button>
        <button
          className="btn btn-accent btn-small btn-icon"
          onClick={handleCreateAIPrompt}
          title="Create AI prompt for this task"
        >
          <Bot size={14} />
        </button>
        <button
          className="btn btn-primary btn-small btn-icon"
          onClick={handleEditClick}
          title="Edit task"
        >
          <Edit size={14} />
        </button>
        <button
          className="btn btn-danger btn-small btn-icon"
          onClick={handleDelete}
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};