import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Note } from '../types';
import { apiService } from '../services/api';

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete }) => {
  const [renderedContent, setRenderedContent] = useState('');

  useEffect(() => {
    const renderContent = async () => {
      try {
        const html = await apiService.renderMarkdown(note.content);
        setRenderedContent(html);
      } catch (error) {
        console.error('Failed to render markdown:', error);
        // Fallback to plain text
        setRenderedContent(escapeHtml(note.content));
      }
    };

    renderContent();
  }, [note.content]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  return (
    <div className="note-item fade-in">
      <div className="note-header">
        <div className="note-date">
          {formatDate(note.created_at)}
        </div>
        <div className="note-actions">
          <button
            className="btn btn-primary btn-small btn-icon"
            onClick={() => onEdit(note)}
            title="Edit note"
          >
            <Edit size={14} />
          </button>
          <button
            className="btn btn-danger btn-small btn-icon"
            onClick={handleDelete}
            title="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div 
        className="note-content"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
};