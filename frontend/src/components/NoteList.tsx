import React, { useState, useRef } from 'react';
import { Plus, StickyNote, Upload } from 'lucide-react';
import { Note } from '../types';
import { NoteItem } from './NoteItem';
import { NoteModal } from './NoteModal';
import { SearchInput } from './SearchInput';

interface NoteListProps {
  notes: Note[];
  onAddNote: (content: string) => void;
  onUpdateNote: (id: number, content: string) => void;
  onDeleteNote: (id: number) => void;
  onSearchNotes: (query: string) => void;
  onExpandNote: (note: Note) => void;
  onNoteClick?: (noteId: number) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSearchNotes,
  onExpandNote,
  onNoteClick,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      onAddNote(newNoteContent.trim());
      setNewNoteContent('');
      setShowInput(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleUpdateNote = (content: string) => {
    if (editingNote && content.trim()) {
      onUpdateNote(editingNote.id, content.trim());
      setEditingNote(null);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchNotes(query);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a markdown file
    const isMarkdown = file.name.toLowerCase().endsWith('.md') || 
                      file.name.toLowerCase().endsWith('.markdown') ||
                      file.type === 'text/markdown';

    if (!isMarkdown) {
      alert('Please select a markdown file (.md or .markdown)');
      return;
    }

    try {
      const content = await file.text();
      if (content.trim()) {
        // Add a header with the filename if the content doesn't start with a header
        const hasHeader = content.trim().startsWith('#');
        const noteContent = hasHeader 
          ? content 
          : `# ${file.name.replace(/\.(md|markdown)$/i, '')}\n\n${content}`;
        
        onAddNote(noteContent.trim());
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading the markdown file. Please try again.');
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">
          <StickyNote size={20} />
          Notes
        </h2>
        <div className="section-actions">
          <button
            className="btn btn-secondary btn-small"
            onClick={handleImportClick}
            title="Import markdown file"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowInput(true)}
          >
            <Plus size={16} />
            Add Note
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      <SearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search notes..."
      />

      {showInput && (
        <div className="input-group fade-in">
          <textarea
            className="input textarea"
            placeholder="Enter note content (Markdown supported)..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary btn-small" onClick={handleAddNote}>
              Save
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => {
                setShowInput(false);
                setNewNoteContent('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state">
          <StickyNote size={48} />
          <p>No notes yet. Add your first note to get started!</p>
        </div>
      ) : (
        notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            onEdit={handleEditNote}
            onDelete={onDeleteNote}
            onExpand={onExpandNote}
            onNoteClick={onNoteClick}
          />
        ))
      )}

      {editingNote && (
        <NoteModal
          note={editingNote}
          onSave={handleUpdateNote}
          onClose={() => setEditingNote(null)}
        />
      )}
    </section>
  );
};