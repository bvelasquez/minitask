import React from 'react';
import { MermaidDiagram } from './MermaidDiagram';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface ParsedContent {
  type: 'markdown' | 'mermaid';
  content: string;
  id?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  // Parse the content to separate markdown and mermaid blocks
  const parseContent = (text: string): ParsedContent[] => {
    const parts: ParsedContent[] = [];
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = mermaidRegex.exec(text)) !== null) {
      // Add markdown content before this mermaid block
      if (match.index > lastIndex) {
        const markdownContent = text.slice(lastIndex, match.index);
        if (markdownContent.trim()) {
          parts.push({
            type: 'markdown',
            content: markdownContent
          });
        }
      }
      
      // Add the mermaid block
      parts.push({
        type: 'mermaid',
        content: match[1].trim(),
        id: `mermaid-${parts.length}`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining markdown content
    if (lastIndex < text.length) {
      const remainingContent = text.slice(lastIndex);
      if (remainingContent.trim()) {
        parts.push({
          type: 'markdown',
          content: remainingContent
        });
      }
    }
    
    // If no mermaid blocks were found, return the entire content as markdown
    if (parts.length === 0) {
      parts.push({
        type: 'markdown',
        content: text
      });
    }
    
    return parts;
  };

  const renderMarkdownToHtml = (markdown: string): string => {
    // Simple markdown to HTML conversion
    // You might want to use a proper markdown library like 'marked' for more features
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Code blocks (non-mermaid)
    html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Auto-link URLs
    html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  };

  const parsedContent = parseContent(content);

  return (
    <div className={`markdown-renderer ${className}`}>
      {parsedContent.map((part, index) => {
        if (part.type === 'mermaid') {
          return (
            <div key={index} className="markdown-mermaid-wrapper">
              <MermaidDiagram 
                chart={part.content} 
                id={part.id}
              />
            </div>
          );
        } else {
          return (
            <div 
              key={index}
              className="markdown-content"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdownToHtml(part.content) 
              }}
            />
          );
        }
      })}
    </div>
  );
};
