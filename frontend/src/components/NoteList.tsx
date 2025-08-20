import React, { useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
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
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSearchNotes,
  onExpandNote,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">
          <StickyNote size={20} />
          Notes
        </h2>
        <button
          className="btn btn-primary btn-small"
          onClick={() => setShowInput(true)}
        >
          <Plus size={16} />
          Add Note
        </button>
      </div>

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