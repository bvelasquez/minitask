import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidDiagram } from './MermaidDiagram';
import { isInternalLink } from '../utils/links';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const navigate = useNavigate();

  // Custom link renderer to handle internal links
  const LinkRenderer = ({ href, children, ...props }: any) => {
    const linkInfo = isInternalLink(href || '');
    
    if (linkInfo.type && linkInfo.id) {
      // Internal link - handle with React Router
      return (
        <a
          {...props}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            navigate(href);
          }}
          style={{ 
            color: 'var(--accent)', 
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
          title={`Go to ${linkInfo.type} #${linkInfo.id}`}
        >
          {children}
        </a>
      );
    }
    
    // External link - open in new tab
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--accent)', textDecoration: 'underline' }}
      >
        {children}
      </a>
    );
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            const isInline = !className || !className.includes("language-");

            if (!isInline && language === "mermaid") {
              return (
                <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: LinkRenderer,
          // Handle task list items properly
          ul: ({ node, className, children, ...props }: any) => {
            const hasTaskListItem = node?.children?.some((child: any) =>
              child?.data?.hProperties?.className?.includes("task-list-item"),
            );
            return (
              <ul
                className={hasTaskListItem ? "contains-task-list" : ""}
                {...props}
              >
                {children}
              </ul>
            );
          },
          li: ({ node, className, children, index, ...props }: any) => {
            const hasTaskListItem =
              node?.data?.hProperties?.className?.includes("task-list-item");
            return (
              <li
                className={hasTaskListItem ? "task-list-item" : ""}
                {...props}
              >
                {children}
              </li>
            );
          },
          // Handle task list input checkboxes
          input: ({ node, className, type, checked, ...props }: any) => {
            if (type === "checkbox") {
              return (
                <input type="checkbox" checked={checked} readOnly {...props} />
              );
            }
            return <input type={type} className={className} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};