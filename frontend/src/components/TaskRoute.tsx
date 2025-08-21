import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Task } from '../types';
import { apiService } from '../services/api';
import { TaskItem } from './TaskItem';

interface TaskRouteProps {
  onAddNote: (content: string) => void;
}

export const TaskRoute: React.FC<TaskRouteProps> = ({ onAddNote }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const tasks = await apiService.getTasks();
        const foundTask = tasks.find(t => t.id === parseInt(id));
        
        if (foundTask) {
          setTask(foundTask);
        } else {
          setError(`Task #${id} not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  const handleUpdateTask = async (taskId: number, updates: { completed?: boolean; description?: string }) => {
    try {
      await apiService.updateTask(taskId, updates);
      // Update local state
      if (task) {
        setTask({ ...task, ...updates });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await apiService.deleteTask(taskId);
      navigate('/'); // Redirect to home after deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const copyTaskLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          Loading task...
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container">
        <div className="error-state">
          <h2>Task Not Found</h2>
          <p>{error || 'The requested task could not be found.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="route-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <div className="route-actions">
          <button className="btn btn-secondary btn-small" onClick={copyTaskLink}>
            <ExternalLink size={14} />
            Copy Link
          </button>
        </div>
      </div>

      <div className="route-content">
        <h1>Task #{task.id}</h1>
        <TaskItem
          task={task}
          onToggle={(id, completed) => handleUpdateTask(id, { completed })}
          onDelete={handleDeleteTask}
          onUpdateDescription={(id, description) => handleUpdateTask(id, { description })}
          onCopyToNote={onAddNote}
        />
      </div>
    </div>
  );
};