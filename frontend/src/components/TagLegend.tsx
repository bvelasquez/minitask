import React, { useState } from 'react';
import { HelpCircle, X, Tag } from 'lucide-react';
import { TAG_DEFINITIONS } from '../utils/taskTags';

export const TagLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Sort tags by priority (highest first) for display
  const sortedTags = Object.values(TAG_DEFINITIONS).sort((a, b) => b.priority - a.priority);

  const getTagDescription = (tagName: string): string => {
    const descriptions: Record<string, string> = {
      'BLOCKED': 'Tasks that cannot proceed due to external dependencies',
      'URGENT': 'High-priority tasks requiring immediate attention',
      'NEEDS REVIEW': 'Tasks requiring review or approval',
      'BUG': 'Bug fixes and issue resolution',
      'IN PROGRESS': 'Tasks currently being worked on',
      'RESEARCH': 'Tasks involving research or investigation',
      'WAITING': 'Tasks waiting for external input or dependencies',
      'FEATURE': 'New feature development',
      'LOW PRIORITY': 'Tasks that can be done later'
    };
    return descriptions[tagName] || 'Custom tag';
  };

  const getUsageExample = (tagName: string): string => {
    const examples: Record<string, string> = {
      'BLOCKED': 'BLOCKED: Fix authentication - waiting for API keys',
      'URGENT': 'URGENT: Database backup failing',
      'NEEDS REVIEW': 'NEEDS REVIEW: Update user documentation',
      'BUG': 'BUG: Mobile checkbox not working',
      'IN PROGRESS': 'IN PROGRESS: Implementing new features',
      'RESEARCH': 'RESEARCH: UX pattern investigation',
      'WAITING': 'WAITING: Code review approval needed',
      'FEATURE': 'FEATURE: Add PDF export functionality',
      'LOW PRIORITY': 'LOW PRIORITY: Clean up old files'
    };
    return examples[tagName] || `${tagName}: Your task description here`;
  };

  if (!isOpen) {
    return (
      <button
        className="tag-legend-button"
        onClick={() => setIsOpen(true)}
        title="Show available task tags"
      >
        <HelpCircle size={16} />
        Tags
      </button>
    );
  }

  return (
    <div className="tag-legend-overlay" onClick={() => setIsOpen(false)}>
      <div className="tag-legend-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tag-legend-header">
          <h3>
            <Tag size={20} />
            Available Task Tags
          </h3>
          <button
            className="tag-legend-close"
            onClick={() => setIsOpen(false)}
            title="Close legend"
          >
            <X size={20} />
          </button>
        </div>

        <div className="tag-legend-content">
          <p className="tag-legend-intro">
            Add these tags to the beginning of your task descriptions to automatically color-code and categorize them:
          </p>

          <div className="tag-legend-list">
            {sortedTags.map((tag) => (
              <div key={tag.name} className="tag-legend-item">
                <div className="tag-legend-item-header">
                  <span
                    className="tag-legend-sample"
                    style={{
                      backgroundColor: tag.backgroundColor,
                      color: tag.color,
                      borderColor: tag.borderColor
                    }}
                  >
                    <Tag size={10} />
                    {tag.name}
                  </span>
                  <span className="tag-legend-priority">Priority: {tag.priority}</span>
                </div>
                <p className="tag-legend-description">{getTagDescription(tag.name)}</p>
                <code className="tag-legend-example">{getUsageExample(tag.name)}</code>
              </div>
            ))}
          </div>

          <div className="tag-legend-tips">
            <h4>Tips:</h4>
            <ul>
              <li>Tags are case-insensitive (BLOCKED, blocked, Blocked all work)</li>
              <li>Multiple tags can be used: "URGENT BUG: Critical security issue"</li>
              <li>Higher priority tags take precedence for visual styling</li>
              <li>Tags are detected from the first line of task descriptions</li>
              <li>Completed tasks override tag colors with muted styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
