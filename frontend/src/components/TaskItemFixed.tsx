import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit } from 'lucide-react';
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
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