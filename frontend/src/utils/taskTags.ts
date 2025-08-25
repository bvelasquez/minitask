export interface TaskTag {
  name: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  priority: number; // Higher priority tags take precedence for styling
}

// Define available tags with their styling
export const TAG_DEFINITIONS: Record<string, TaskTag> = {
  'BLOCKED': {
    name: 'BLOCKED',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    priority: 100
  },
  'NEEDS REVIEW': {
    name: 'NEEDS REVIEW',
    color: '#92400e',
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
    priority: 90
  },
  'URGENT': {
    name: 'URGENT',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
    priority: 95
  },
  'IN PROGRESS': {
    name: 'IN PROGRESS',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    priority: 80
  },
  'WAITING': {
    name: 'WAITING',
    color: '#374151',
    backgroundColor: '#d1d5db',
    borderColor: '#9ca3af',
    priority: 70
  },
  'LOW PRIORITY': {
    name: 'LOW PRIORITY',
    color: '#374151',
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
    priority: 60
  },
  'RESEARCH': {
    name: 'RESEARCH',
    color: '#ffffff',
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
    priority: 75
  },
  'BUG': {
    name: 'BUG',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    priority: 85
  },
  'FEATURE': {
    name: 'FEATURE',
    color: '#ffffff',
    backgroundColor: '#10b981',
    borderColor: '#059669',
    priority: 65
  }
};

/**
 * Extract tags from task description
 * Tags are identified by being in ALL CAPS and surrounded by word boundaries
 * They can be at the beginning of the description or on the first line
 */
export function extractTaskTags(description: string): TaskTag[] {
  const firstLine = description.split('\n')[0];
  const tags: TaskTag[] = [];
  
  // Look for defined tags in the first line
  Object.keys(TAG_DEFINITIONS).forEach(tagName => {
    // Create a regex that matches the tag name as a whole word (case insensitive)
    const regex = new RegExp(`\\b${tagName.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(firstLine)) {
      tags.push(TAG_DEFINITIONS[tagName]);
    }
  });
  
  // Sort by priority (highest first)
  return tags.sort((a, b) => b.priority - a.priority);
}

/**
 * Get the primary tag (highest priority) for styling the task item
 */
export function getPrimaryTag(description: string): TaskTag | null {
  const tags = extractTaskTags(description);
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Get all tags for display
 */
export function getAllTags(description: string): TaskTag[] {
  return extractTaskTags(description);
}

/**
 * Remove tag text from description for cleaner display
 * This is optional - you might want to keep tags visible in the description
 */
export function removeTagsFromDescription(description: string): string {
  let cleanDescription = description;
  
  Object.keys(TAG_DEFINITIONS).forEach(tagName => {
    // Remove the tag from the beginning of lines, but preserve the rest
    const regex = new RegExp(`^\\s*${tagName.replace(/\s+/g, '\\s+')}\\s*:?\\s*`, 'gim');
    cleanDescription = cleanDescription.replace(regex, '');
  });
  
  return cleanDescription.trim();
}

/**
 * Check if a task has a specific tag
 */
export function hasTag(description: string, tagName: string): boolean {
  const tags = extractTaskTags(description);
  return tags.some(tag => tag.name === tagName);
}
