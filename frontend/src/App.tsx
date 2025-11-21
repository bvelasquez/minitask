import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Task, Note } from './types';
import { apiService } from './services/api';
import { useSocket } from './hooks/useSocket';
import { useTheme } from './hooks/useTheme';
import { TaskList } from './components/TaskList';
import { NoteList } from './components/NoteList';
import { NoteFullView } from './components/NoteFullView';
import { TaskRoute } from './components/TaskRoute';
import { NoteRoute } from './components/NoteRoute';
import { Instructions } from './components/Instructions';
import { TagLegend } from './components/TagLegend';
import { Dashboard } from './components/Dashboard';

type TabType = 'dashboard' | 'tasks' | 'notes';

function MainApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load active tab from localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('app_activeTab');
    return (saved === 'dashboard' || saved === 'tasks' || saved === 'notes') ? saved : 'dashboard';
  });
  
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('app_activeTab', activeTab);
  }, [activeTab]);

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
      // Update the expanded note state to reflect changes
      if (expandedNote && expandedNote.id === id) {
        setExpandedNote({ ...expandedNote, content });
      }
      // WebSocket will handle the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await apiService.deleteNote(id);
      // Close expanded view if this note is being deleted
      if (expandedNote && expandedNote.id === id) {
        setExpandedNote(null);
      }
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

  const handleExpandNote = (note: Note) => {
    setExpandedNote(note);
  };

  // Navigation helpers
  const handleTaskClick = (taskId: number) => {
    navigate(`/task/${taskId}`);
  };

  const handleNoteClick = (noteId: number) => {
    navigate(`/note/${noteId}`);
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
        <div className="header-actions">
          <TagLegend />
        </div>
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
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
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
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'tasks' && (
            <TaskList
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
              onAddNote={handleAddNote}
              onTaskClick={handleTaskClick}
            />
          )}
          {activeTab === 'notes' && (
            <NoteList
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onSearchNotes={handleSearchNotes}
              onExpandNote={handleExpandNote}
              onNoteClick={handleNoteClick}
            />
          )}
        </div>
      </div>

      {expandedNote && (
        <NoteFullView
          note={expandedNote}
          onClose={() => setExpandedNote(null)}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
        />
      )}

      <Instructions />
    </div>
  );
}

function App() {
  // Shared note handler for routes
  const handleAddNote = async (content: string) => {
    try {
      await apiService.createNote(content);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/task/:id" element={<TaskRoute onAddNote={handleAddNote} />} />
      <Route path="/note/:id" element={<NoteRoute />} />
    </Routes>
  );
}

export default App;