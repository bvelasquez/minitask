// Utility functions for generating and handling links

export const generateTaskLink = (taskId: number): string => {
  return `${window.location.origin}/task/${taskId}`;
};

export const generateNoteLink = (noteId: number): string => {
  return `${window.location.origin}/note/${noteId}`;
};

export const generateTaskMarkdownLink = (taskId: number, description?: string): string => {
  const title = description ? description.split('\n')[0].substring(0, 50) : `Task #${taskId}`;
  return `[${title}](${generateTaskLink(taskId)})`;
};

export const generateNoteMarkdownLink = (noteId: number, content?: string): string => {
  const title = content ? content.split('\n')[0].substring(0, 50) : `Note #${noteId}`;
  return `[${title}](${generateNoteLink(noteId)})`;
};

// Parse internal links from markdown content
export const parseInternalLinks = (content: string): { taskIds: number[], noteIds: number[] } => {
  const taskIds: number[] = [];
  const noteIds: number[] = [];
  
  // Match task links: /task/123 or [text](/task/123)
  const taskMatches = content.match(/\/task\/(\d+)/g);
  if (taskMatches) {
    taskMatches.forEach(match => {
      const id = parseInt(match.replace('/task/', ''));
      if (!taskIds.includes(id)) {
        taskIds.push(id);
      }
    });
  }
  
  // Match note links: /note/456 or [text](/note/456)
  const noteMatches = content.match(/\/note\/(\d+)/g);
  if (noteMatches) {
    noteMatches.forEach(match => {
      const id = parseInt(match.replace('/note/', ''));
      if (!noteIds.includes(id)) {
        noteIds.push(id);
      }
    });
  }
  
  return { taskIds, noteIds };
};

// Check if a URL is an internal link
export const isInternalLink = (url: string): { type: 'task' | 'note' | null, id: number | null } => {
  // Only treat as internal if it's a relative path starting with /
  // Don't match full URLs with protocols or domains
  if (!url || url.includes('://') || url.includes('localhost') || url.includes('.')) {
    return { type: null, id: null };
  }
  
  const taskMatch = url.match(/^\/task\/(\d+)$/);
  if (taskMatch) {
    return { type: 'task', id: parseInt(taskMatch[1]) };
  }
  
  const noteMatch = url.match(/^\/note\/(\d+)$/);
  if (noteMatch) {
    return { type: 'note', id: parseInt(noteMatch[1]) };
  }
  
  return { type: null, id: null };
};