import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Note } from '../types';
import { apiService } from '../services/api';
import { NoteFullView } from './NoteFullView';

export const NoteRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const notes = await apiService.getNotes();
        const foundNote = notes.find(n => n.id === parseInt(id));
        
        if (foundNote) {
          setNote(foundNote);
        } else {
          setError(`Note #${id} not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [id]);

  const handleUpdateNote = async (noteId: number, content: string) => {
    try {
      await apiService.updateNote(noteId, content);
      // Update local state
      if (note) {
        setNote({ ...note, content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await apiService.deleteNote(noteId);
      navigate('/'); // Redirect to home after deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const copyNoteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          Loading note...
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="container">
        <div className="error-state">
          <h2>Note Not Found</h2>
          <p>{error || 'The requested note could not be found.'}</p>
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
          <button className="btn btn-secondary btn-small" onClick={copyNoteLink}>
            <ExternalLink size={14} />
            Copy Link
          </button>
        </div>
      </div>

      <div className="route-content">
        <h1>Note #{note.id}</h1>
        <NoteFullView
          note={note}
          onClose={() => navigate('/')}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
        />
      </div>
    </div>
  );
};