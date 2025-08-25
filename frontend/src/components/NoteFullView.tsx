import React, { useState, useRef, useEffect } from 'react';
import { X, Edit, Trash2, Save, AlertTriangle, Copy, Download, Link } from 'lucide-react';
import { Note } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteFullViewProps {
  note: Note;
  onClose: () => void;
  onUpdate: (id: number, content: string) => void;
  onDelete: (id: number) => void;
}

export const NoteFullView: React.FC<NoteFullViewProps> = ({
  note,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditContent(note.content);
  }, [note.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editContent.trim() !== note.content) {
      onUpdate(note.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(note.id);
    onClose();
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      console.log('Note markdown copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = note.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/note/${note.id}`;
      await navigator.clipboard.writeText(link);
      console.log('Note link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link to clipboard:', err);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `note-${note.id}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        handleCancel();
      } else {
        onClose();
      }
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      if (isEditing) {
        handleSave();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Note #{note.id}</h2>
          <div className="modal-actions">
            {!isEditing && (
              <>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleCopyMarkdown}
                  title="Copy markdown to clipboard"
                >
                  <Copy size={16} />
                  Copy
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleCopyLink}
                  title="Copy note link"
                >
                  <Link size={16} />
                  Link
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleDownloadMarkdown}
                  title="Download as markdown file"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={16} />
                  Edit
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  className="btn btn-primary btn-small"
                  onClick={handleSave}
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            )}
            <button
              className="btn btn-danger btn-small"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              Delete
            </button>
            <button className="btn btn-secondary btn-small" onClick={onClose}>
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        <div className="modal-content" onKeyDown={handleKeyDown}>
          <div className="note-meta">
            <span>Created: {formatDate(note.created_at)}</span>
            {note.updated_at !== note.created_at && (
              <span>Updated: {formatDate(note.updated_at)}</span>
            )}
          </div>

          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="note-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your note in Markdown..."
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div className="note-content-full">
              <MarkdownRenderer content={note.content} />
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  <AlertTriangle size={20} />
                  Confirm Delete
                </h3>
              </div>
              <div className="modal-content">
                <p>Are you sure you want to delete this note? This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete Note
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};