import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
            <div key={index} className="markdown-content">
              <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // Custom styling for tables
                table: ({ children, ...props }) => (
                  <table className="markdown-table" {...props}>
                    {children}
                  </table>
                ),
                // Make links open in new tab
                a: ({ href, children, ...props }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
              >
                {part.content}
              </ReactMarkdown>
            </div>
          );
        }
      })}
    </div>
  );
};