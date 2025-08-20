import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Task, Note } from './types';
import { apiService } from './services/api';
import { useSocket } from './hooks/useSocket';
import { useTheme } from './hooks/useTheme';
import { TaskList } from './components/TaskList';
import { NoteList } from './components/NoteList';

type TabType = 'tasks' | 'notes';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  const { theme, toggleTheme } = useTheme();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tasksData, notesData] = await Promise.all([
          apiService.getTasks(),
          apiService.getNotes(),
        ]);
        setTasks(tasksData);
        setNotes(notesData);
        setAllNotes(notesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // WebSocket event handlers
  useSocket({
    taskAdded: (task) => {
      setTasks((prev) => [...prev, task]);
    },
    taskUpdated: (updatedTask) => {
      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    },
    taskDeleted: (taskId) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    },
    tasksReordered: () => {
      // Reload tasks to get correct order
      apiService.getTasks().then(setTasks);
    },
    noteAdded: (note) => {
      setNotes((prev) => [note, ...prev]);
      setAllNotes((prev) => [note, ...prev]);
    },
    noteUpdated: (updatedNote) => {
      const updateNotesList = (prev: Note[]) =>
        prev.map((note) => (note.id === updatedNote.id ? updatedNote : note));
      setNotes(updateNotesList);
      setAllNotes(updateNotesList);
    },
    noteDeleted: (noteId) => {
      const filterNotes = (prev: Note[]) => prev.filter((note) => note.id !== noteId);
      setNotes(filterNotes);
      setAllNotes(filterNotes);
    },
  });

  // Task handlers
  const handleAddTask = async (description: string) => {
    try {
      await apiService.createTask(description);
      // WebSocket will handle the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    }
  };

  const handleUpdateTask = async (id: number, updates: { completed?: boolean; description?: string }) => {
    try {
      console.log(`[FRONTEND DEBUG] handleUpdateTask called:`, {
        taskId: id,
        updates: updates,
        completedType: typeof updates.completed,
        completedValue: updates.completed
      });
      await apiService.updateTask(id, updates);
      console.log(`[FRONTEND DEBUG] handleUpdateTask - API call completed successfully`);
      // WebSocket will handle the update
    } catch (err) {
      console.error(`[FRONTEND DEBUG] handleUpdateTask - API call failed:`, err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await apiService.deleteTask(id);
      // WebSocket will handle the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleReorderTasks = async (taskIds: number[]) => {
    try {
      // Optimistically update the UI
      const reorderedTasks = taskIds.map((id) => tasks.find((task) => task.id === id)!);
      setTasks(reorderedTasks);
      
      await apiService.reorderTasks(taskIds);
      // WebSocket will handle the final update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks');
      // Reload tasks on error
      apiService.getTasks().then(setTasks);
    }
  };

  // Note handlers
  const handleAddNote = async (content: string) => {
    try {
      await apiService.createNote(content);
      // WebSocket will handle the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleUpdateNote = async (id: number, content: string) => {
    try {
      await apiService.updateNote(id, content);
      // WebSocket will handle the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await apiService.deleteNote(id);
      // WebSocket will handle the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const handleSearchNotes = async (query: string) => {
    try {
      if (query.trim()) {
        const searchResults = await apiService.searchNotes(query);
        setNotes(searchResults);
      } else {
        setNotes(allNotes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search notes');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <header className="header">
        <h1>Task & Notes Dashboard</h1>
        <p>Manage your tasks and notes with ease</p>
      </header>

      {error && (
        <div style={{ 
          background: 'var(--danger)', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({tasks.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes ({notes.length})
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'tasks' && (
            <TaskList
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
            />
          )}
          {activeTab === 'notes' && (
            <NoteList
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onSearchNotes={handleSearchNotes}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;