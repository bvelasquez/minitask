import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface DashboardTile {
  title: string;
  description: string;
  url: string;
}

interface DashboardConfig {
  tiles: DashboardTile[];
}

export function Dashboard() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/dashboard.yaml')
      .then(response => {
        if (!response.ok) {
          throw new Error('Dashboard configuration not found. Copy dashboard.sample.yaml to dashboard.yaml');
        }
        return response.text();
      })
      .then(yamlText => {
        // Simple YAML parser for our basic structure
        const lines = yamlText.split('\n');
        const tiles: DashboardTile[] = [];
        let currentTile: Partial<DashboardTile> = {};
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('- title:')) {
            if (currentTile.title) {
              tiles.push(currentTile as DashboardTile);
            }
            currentTile = { title: trimmed.replace('- title:', '').replace(/"/g, '').trim() };
          } else if (trimmed.startsWith('description:')) {
            currentTile.description = trimmed.replace('description:', '').replace(/"/g, '').trim();
          } else if (trimmed.startsWith('url:')) {
            currentTile.url = trimmed.replace('url:', '').replace(/"/g, '').trim();
          }
        }
        if (currentTile.title) {
          tiles.push(currentTile as DashboardTile);
        }
        
        setConfig({ tiles });
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  if (!config) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-grid">
      {config.tiles.map((tile, index) => (
        <a
          key={index}
          href={tile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="dashboard-tile"
        >
          <div className="tile-content">
            <h3>{tile.title}</h3>
            <p>{tile.description}</p>
          </div>
          <ExternalLink size={16} className="tile-icon" />
        </a>
      ))}
    </div>
  );
}
