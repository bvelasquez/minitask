import React, { useState } from 'react';
import { X, Edit, Trash2, Save, Copy, Download, Check } from 'lucide-react';
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
  const [copySuccess, setCopySuccess] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSave = () => {
    if (editContent.trim() && editContent !== note.content) {
      onUpdate(note.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        handleCancel();
      } else {
        onClose();
      }
    } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (isEditing) {
        handleSave();
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = note.content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate filename from note content or use timestamp
    const firstLine = note.content.split('\n')[0].replace(/[^\w\s-]/g, '').trim();
    const filename = firstLine 
      ? `${firstLine.substring(0, 50)}.md`
      : `note-${new Date(note.created_at).toISOString().split('T')[0]}.md`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="note-fullview-overlay" onClick={onClose}>
      <div className="note-fullview" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="note-fullview-header">
          <div className="note-fullview-info">
            <h2 className="note-fullview-title">
              {isEditing ? 'Edit Note' : 'Note'}
            </h2>
            <div className="note-fullview-date">
              Created: {formatDate(note.created_at)}
              {note.updated_at !== note.created_at && (
                <span> • Updated: {formatDate(note.updated_at)}</span>
              )}
            </div>
          </div>
          <div className="note-fullview-actions">
            {isEditing ? (
              <>
                <button
                  className="btn btn-primary btn-small"
                  onClick={handleSave}
                  title="Save (Ctrl/Cmd+S)"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleCancel}
                  title="Cancel (Esc)"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleCopyToClipboard}
                  title="Copy markdown to clipboard"
                >
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  {copySuccess ? 'Copied!' : 'Copy'}
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
                  title="Edit note"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={handleDelete}
                  title="Delete note"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
            <button
              className="btn btn-secondary btn-small btn-icon"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="note-fullview-content">
          {isEditing ? (
            <textarea
              className="note-fullview-editor"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter note content (Markdown supported)..."
              autoFocus
            />
          ) : (
            <MarkdownRenderer 
              content={note.content}
              className="note-fullview-rendered"
            />
          )}
        </div>

        {isEditing && (
          <div className="note-fullview-footer">
            <div className="note-fullview-help">
              <strong>Tip:</strong> Markdown and Mermaid diagrams are supported. Use <code>```mermaid</code> for diagrams. Ctrl/Cmd+S to save, Esc to cancel.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
