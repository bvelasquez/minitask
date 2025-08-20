import React, { useState } from 'react';
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
import { Plus, CheckSquare, ClipboardList } from 'lucide-react';
import { Task } from '../types';
import { TaskItem } from './TaskItemFixed';


interface TaskListProps {
  tasks: Task[];
  onAddTask: (description: string) => void;
  onUpdateTask: (id: number, updates: { completed?: boolean; description?: string }) => void;
  onDeleteTask: (id: number) => void;
  onReorderTasks: (taskIds: number[]) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      const taskIds = reorderedTasks.map((task) => task.id);
      onReorderTasks(taskIds);
    }
  };

  const handleAddTask = () => {
    if (newTaskDescription.trim()) {
      onAddTask(newTaskDescription.trim());
      setNewTaskDescription('');
      setShowInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setNewTaskDescription('');
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">
          <CheckSquare size={20} />
          Tasks
        </h2>
        <button
          className="btn btn-primary btn-small"
          onClick={() => setShowInput(true)}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {showInput && (
        <div className="input-group fade-in">
          <textarea
            className="input task-textarea"
            placeholder="Enter task description... (Shift+Enter for new line, Enter to save)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            rows={3}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary btn-small" onClick={handleAddTask}>
              Save
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => {
                setShowInput(false);
                setNewTaskDescription('');
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
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={(id, completed) => onUpdateTask(id, { completed })}
                onDelete={onDeleteTask}
                onUpdateDescription={(id, description) => onUpdateTask(id, { description })}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
};