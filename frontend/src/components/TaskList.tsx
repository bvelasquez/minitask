import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, CheckSquare, ClipboardList, Eye, EyeOff } from 'lucide-react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { SearchInput } from './SearchInput';


interface TaskListProps {
  tasks: Task[];
  onAddTask: (description: string) => void;
  onUpdateTask: (id: number, updates: { completed?: boolean; description?: string }) => void;
  onDeleteTask: (id: number) => void;
  onReorderTasks: (taskIds: number[]) => void;
  onAddNote: (content: string) => void;
  onTaskClick?: (taskId: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  onAddNote,
  onTaskClick,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load showCompleted state from localStorage
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem('taskList_showCompleted');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save showCompleted state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskList_showCompleted', JSON.stringify(showCompleted));
  }, [showCompleted]);

  // Filter and sort tasks based on search query and completion status
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompletionFilter = showCompleted || !task.completed;
      return matchesSearch && matchesCompletionFilter;
    })
    .sort((a, b) => {
      // Sort completed tasks to the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // For tasks with the same completion status, maintain original order
      return a.order_index - b.order_index;
    });

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
      const newIndex = filteredTasks.findIndex((task) => task.id === over.id);

      const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      const taskIds = reorderedTasks.map((task) => task.id);
      onReorderTasks(taskIds);
    }
  };

  const handleMoveToTop = (taskId: number) => {
    const taskIds = tasks.map(task => task.id);
    const filteredIds = taskIds.filter(id => id !== taskId);
    const reorderedIds = [taskId, ...filteredIds];
    onReorderTasks(reorderedIds);
  };

  const handleMoveToBottom = (taskId: number) => {
    const taskIds = tasks.map(task => task.id);
    const filteredIds = taskIds.filter(id => id !== taskId);
    const reorderedIds = [...filteredIds, taskId];
    onReorderTasks(reorderedIds);
  };

  const handleAddTask = () => {
    if (newTaskDescription.trim()) {
      onAddTask(newTaskDescription.trim());
      setNewTaskDescription('');
      setShowInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowInput(false);
      setNewTaskDescription("");
    } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">
          <CheckSquare size={20} />
          Tasks ({totalCount - completedCount}/{totalCount})
        </h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className={`btn btn-small ${
              showCompleted ? "btn-secondary" : "btn-primary"
            }`}
            onClick={() => setShowCompleted(!showCompleted)}
            title={
              showCompleted ? "Hide completed tasks" : "Show completed tasks"
            }
          >
            {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
            {showCompleted ? "Hide" : "Show"} Completed
          </button>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowInput(true)}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search tasks..."
      />

      {showInput && (
        <div className="input-group fade-in">
          <textarea
            className="input task-textarea"
            placeholder="Enter task description... (Cmd/Ctrl+S to save, Escape to cancel)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            rows={12}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              className="btn btn-primary btn-small"
              onClick={handleAddTask}
            >
              Save
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => {
                setShowInput(false);
                setNewTaskDescription("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>No tasks yet. Add your first task to get started!</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>
            {searchQuery
              ? `No tasks found matching "${searchQuery}"`
              : "No active tasks. All tasks are completed!"}
          </p>
          {searchQuery && (
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks}
            strategy={verticalListSortingStrategy}
          >
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={(id, completed) => onUpdateTask(id, { completed })}
                onDelete={onDeleteTask}
                onUpdateDescription={(id, description) =>
                  onUpdateTask(id, { description })
                }
                onCopyToNote={onAddNote}
                onTaskClick={onTaskClick}
                onMoveToTop={handleMoveToTop}
                onMoveToBottom={handleMoveToBottom}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
};