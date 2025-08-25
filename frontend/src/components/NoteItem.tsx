import React from 'react';
import { Edit, Trash2, Maximize2, ExternalLink, Link, Copy, Download } from 'lucide-react';
import { Note } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onExpand: (note: Note) => void;
  onNoteClick?: (noteId: number) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete, onExpand, onNoteClick }) => {
  const createPreview = (content: string): string => {
    const maxLength = 200;
    if (content.length <= maxLength) {
      return content;
    }
    
    // Try to break at a sentence or paragraph
    const truncated = content.substring(0, maxLength);
    const lastSentence = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf('\n\n')
    );
    
    if (lastSentence > maxLength * 0.6) {
      return content.substring(0, lastSentence + 1);
    }
    
    // Fall back to word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.6) {
      return content.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  const isLongNote = note.content.length > 200;
  const displayContent = isLongNote ? createPreview(note.content) : note.content;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
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

  return (
    <div className="note-item fade-in">
      <div className="note-header">
        <div className="note-date">
          {formatDate(note.created_at)}
        </div>
        <div className="note-actions">
          {isLongNote && (
            <button
              className="btn btn-secondary btn-small btn-icon"
              onClick={() => onExpand(note)}
              title="View full note"
            >
              <Maximize2 size={14} />
            </button>
          )}
          {onNoteClick && (
            <button
              className="btn btn-secondary btn-small btn-icon"
              onClick={() => onNoteClick(note.id)}
              title="Open note in new view"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            className="btn btn-secondary btn-small btn-icon"
            onClick={handleCopyMarkdown}
            title="Copy markdown to clipboard"
          >
            <Copy size={14} />
          </button>
          <button
            className="btn btn-secondary btn-small btn-icon"
            onClick={handleCopyLink}
            title="Copy note link"
          >
            <Link size={14} />
          </button>
          <button
            className="btn btn-secondary btn-small btn-icon"
            onClick={handleDownloadMarkdown}
            title="Download as markdown file"
          >
            <Download size={14} />
          </button>
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
        className={`note-content ${isLongNote ? 'note-content-preview' : ''}`}
        onClick={isLongNote ? () => onExpand(note) : undefined}
      >
        <MarkdownRenderer content={displayContent} />
      </div>
      {isLongNote && (
        <div className="note-expand-hint">
          Click to view full note...
        </div>
      )}
    </div>
  );
};