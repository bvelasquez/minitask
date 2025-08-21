import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Note } from '../types';

interface NoteModalProps {
  note: Note;
  onSave: (content: string) => void;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ note, onSave, onClose }) => {
  const [content, setContent] = useState(note.content);

  useEffect(() => {
    setContent(note.content);
  }, [note]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Note</h3>
          <button
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="input-group">
          <textarea
            className="input textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter note content (Markdown supported)..."
            autoFocus
            style={{ minHeight: '500px' }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};