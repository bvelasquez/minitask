import React from 'react';
import { Task } from '../types';

interface TaskItemTestProps {
  task: Task;
  onToggle: (id: number, completed: boolean) => void;
}

export const TaskItemTest: React.FC<TaskItemTestProps> = ({ task, onToggle }) => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', margin: '5px' }}>
      <input
        type="checkbox"
        checked={task.completed}
        onClick={() => {
          console.log('[TEST] Checkbox CLICKED for task', task.id);
        }}
        onChange={(e) => {
          console.log('[TEST] Checkbox CHANGED for task', task.id, 'checked:', e.target.checked);
          onToggle(task.id, e.target.checked);
        }}
      />
      <span style={{ marginLeft: '10px', textDecoration: task.completed ? 'line-through' : 'none' }}>
        {task.description}
      </span>
    </div>
  );
};