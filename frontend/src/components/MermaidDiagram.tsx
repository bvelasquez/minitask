import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect if we're in dark mode
  const isDarkMode = () => {
    return document.documentElement.classList.contains('dark') || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  useEffect(() => {
    const darkMode = isDarkMode();
    
    // Initialize mermaid with theme-appropriate configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      fontSize: 14,
      themeVariables: darkMode ? {
        // Dark theme variables
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#60a5fa',
        lineColor: '#cbd5e1',
        sectionBkgColor: '#1e293b',
        altSectionBkgColor: '#334155',
        gridColor: '#475569',
        secondaryColor: '#64748b',
        tertiaryColor: '#475569',
        background: '#0f172a',
        mainBkg: '#1e293b',
        secondBkg: '#334155',
        tertiaryBkg: '#475569',
        // Text colors
        textColor: '#f8fafc',
        darkTextColor: '#f8fafc',
        // Node colors
        fillType0: '#3b82f6',
        fillType1: '#10b981',
        fillType2: '#f59e0b',
        fillType3: '#ef4444',
        fillType4: '#8b5cf6',
        fillType5: '#06b6d4',
        fillType6: '#f97316',
        fillType7: '#84cc16'
      } : {
        // Light theme variables
        primaryColor: '#3b82f6',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#2563eb',
        lineColor: '#64748b',
        sectionBkgColor: '#f8fafc',
        altSectionBkgColor: '#f1f5f9',
        gridColor: '#e2e8f0',
        secondaryColor: '#64748b',
        tertiaryColor: '#94a3b8',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondBkg: '#f8fafc',
        tertiaryBkg: '#f1f5f9',
        // Text colors
        textColor: '#1e293b',
        darkTextColor: '#1e293b'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      },
      gantt: {
        useMaxWidth: true,
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        sectionFontSize: 11,
        numberSectionStyles: 4
      },
      class: {
        useMaxWidth: true
      },
      state: {
        useMaxWidth: true
      },
      er: {
        useMaxWidth: true
      }
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !chart.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Detect current theme and reinitialize if needed
        const darkMode = isDarkMode();
        
        // Reinitialize mermaid with current theme
        mermaid.initialize({
          startOnLoad: false,
          theme: darkMode ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
          fontSize: 14,
          themeVariables: darkMode ? {
            // Dark theme variables
            primaryColor: '#3b82f6',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: '#60a5fa',
            lineColor: '#cbd5e1',
            sectionBkgColor: '#1e293b',
            altSectionBkgColor: '#334155',
            gridColor: '#475569',
            secondaryColor: '#64748b',
            tertiaryColor: '#475569',
            background: '#0f172a',
            mainBkg: '#1e293b',
            secondBkg: '#334155',
            tertiaryBkg: '#475569',
            textColor: '#f8fafc',
            darkTextColor: '#f8fafc',
            fillType0: '#3b82f6',
            fillType1: '#10b981',
            fillType2: '#f59e0b',
            fillType3: '#ef4444',
            fillType4: '#8b5cf6',
            fillType5: '#06b6d4',
            fillType6: '#f97316',
            fillType7: '#84cc16'
          } : {
            // Light theme variables  
            primaryColor: '#3b82f6',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#2563eb',
            lineColor: '#64748b',
            sectionBkgColor: '#f8fafc',
            altSectionBkgColor: '#f1f5f9',
            gridColor: '#e2e8f0',
            secondaryColor: '#64748b',
            tertiaryColor: '#94a3b8',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#f8fafc',
            tertiaryBkg: '#f1f5f9',
            textColor: '#1e293b',
            darkTextColor: '#1e293b'
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35
          },
          gantt: {
            useMaxWidth: true,
            leftPadding: 75,
            gridLineStartPadding: 35,
            fontSize: 11,
            sectionFontSize: 11,
            numberSectionStyles: 4
          },
          class: {
            useMaxWidth: true
          },
          state: {
            useMaxWidth: true
          },
          er: {
            useMaxWidth: true
          }
        });
        
        // Generate a unique ID for this diagram
        const diagramId = id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clear the element
        elementRef.current.innerHTML = '';
        
        // Validate and render the mermaid diagram
        const isValid = await mermaid.parse(chart);
        if (!isValid) {
          throw new Error('Invalid Mermaid syntax');
        }

        const { svg } = await mermaid.render(diagramId, chart);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          
          // Make the SVG responsive and apply theme-specific styles
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            
            // Apply additional dark mode styles if needed
            if (darkMode) {
              svgElement.style.filter = 'none'; // Remove any default filters
              // Ensure text is visible in dark mode
              const textElements = svgElement.querySelectorAll('text');
              textElements.forEach(text => {
                if (!text.getAttribute('fill') || text.getAttribute('fill') === '#000000' || text.getAttribute('fill') === 'black') {
                  text.setAttribute('fill', '#f8fafc');
                }
              });
              
              // Ensure lines and paths are visible
              const pathElements = svgElement.querySelectorAll('path, line');
              pathElements.forEach(path => {
                if (!path.getAttribute('stroke') || path.getAttribute('stroke') === '#000000' || path.getAttribute('stroke') === 'black') {
                  path.setAttribute('stroke', '#cbd5e1');
                }
              });
            }
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      renderDiagram();
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // Also listen for manual theme changes (if you have a theme toggle)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          renderDiagram();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      observer.disconnect();
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-title">Diagram Error</div>
        <div className="mermaid-error-message">{error}</div>
        <details className="mermaid-error-details">
          <summary>Show diagram source</summary>
          <pre className="mermaid-error-source">{chart}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="mermaid-container">
      {isLoading && (
        <div className="mermaid-loading">
          <div className="mermaid-loading-spinner"></div>
          <span>Rendering diagram...</span>
        </div>
      )}
      <div 
        ref={elementRef} 
        className="mermaid-diagram"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};
