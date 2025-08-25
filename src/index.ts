import { TaskNotesMCPServer } from './mcp-server.js';
import { WebServer } from './web-server.js';
import { Database } from './database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import open from 'open';

const execAsync = promisify(exec);

// Browser lock management is now handled by the WebServer class

async function isWebServerHealthy(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:3020/api/tasks", {
      method: "GET",
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function waitForServerHealth(timeoutMs: number): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 500; // Check every 500ms
  
  while (Date.now() - startTime < timeoutMs) {
    if (await isWebServerHealthy()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return false;
}

async function ensureWebServerRunning(): Promise<boolean> {
  try {
    // First, try to health check the API directly
    if (await isWebServerHealthy()) {
      console.error('Task-notes web server already running and healthy');
      return true;
    }

    // Check if PM2 app is running
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    const taskNotesApp = processes.find((p: any) => p.name === 'task-notes-server');
    
    if (!taskNotesApp || taskNotesApp.pm2_env.status !== 'online') {
      console.error('Starting task-notes web server with PM2...');
      await execAsync('pm2 start ecosystem.config.cjs');
      
      // Wait for server to be ready with health checks
      console.error('Waiting for server to start...');
      const isHealthy = await waitForServerHealth(10000); // 10 second timeout
      
      if (isHealthy) {
        console.error('Web server started successfully with PM2');
        return true;
      } else {
        console.error('Failed to start web server with PM2 - health check failed');
        return false;
      }
    } else {
      // PM2 says it's online, but let's verify with health check
      console.error('PM2 reports server online, verifying health...');
      const isHealthy = await waitForServerHealth(5000); // 5 second timeout for existing server
      
      if (isHealthy) {
        console.error('Task-notes web server confirmed healthy');
        return true;
      } else {
        console.error('PM2 server online but API not responding, attempting restart...');
        await execAsync('pm2 restart task-notes-server');
        const isHealthyAfterRestart = await waitForServerHealth(10000);
        
        if (isHealthyAfterRestart) {
          console.error('Web server restarted and is now healthy');
          return true;
        } else {
          console.error('Failed to get healthy web server after restart');
          return false;
        }
      }
    }
  } catch (error) {
    console.error('Error managing PM2 server:', error);
    return false;
  }
}

async function openDashboardIfNeeded(url: string, force: boolean = false): Promise<void> {
  // In MCP mode, we'll let the web server handle browser opening
  // This is just a fallback for direct browser opening
  if (force) {
    try {
      await open(url);
      console.error('Dashboard opened in your default browser');
    } catch (error) {
      console.error(`Could not auto-open browser. Please visit: ${url}`);
    }
  } else {
    console.error(`Dashboard available at: ${url}`);
    console.error('Use --force-browser flag to force open browser');
  }
}

async function main() {
  // Check if we should run in MCP mode or web mode
  const args = process.argv.slice(2);
  
  // Handle special flags
  if (args.includes('--clear-browser-lock')) {
    const BROWSER_LOCK_FILE = path.join(os.tmpdir(), 'task-notes-dashboard.lock');
    try {
      if (fs.existsSync(BROWSER_LOCK_FILE)) {
        fs.unlinkSync(BROWSER_LOCK_FILE);
        console.log('Browser lock file cleared successfully');
      } else {
        console.log('No browser lock file found');
      }
    } catch (error) {
      console.error('Error clearing browser lock file:', error);
    }
    return;
  }
  
  const isMCPMode = args.includes('--mcp') || process.env.NODE_ENV === 'mcp';
  
  if (isMCPMode) {
    // Run MCP server with PM2-managed web dashboard
    console.error('Starting Task Notes MCP Server...');
    
    // Ensure web server is running via PM2
    const webServerRunning = await ensureWebServerRunning();
    
    if (!webServerRunning) {
      console.error('Error: Could not start or connect to web server via PM2');
      console.error('MCP server requires the web server to be running for API access');
      console.error('Please check PM2 status with: pm2 status');
      process.exit(1);
    }
    
    console.error("Web dashboard available at: http://localhost:3020");
    
    // Now create MCP server that will use the web server's API
    const mcpServer = new TaskNotesMCPServer("http://localhost:3020/api");
    
    // Optionally auto-open dashboard (can be disabled with --no-browser flag)
    if (!args.includes('--no-browser')) {
      const forceBrowser = args.includes('--force-browser');
      await openDashboardIfNeeded("http://localhost:3020", forceBrowser);
    }
    
    process.on('SIGINT', () => {
      console.error('Shutting down MCP server...');
      console.error('Note: Web server will continue running via PM2');
      console.error('Use "pm2 stop task-notes-server" to stop the web server');
      
      // No need to clean up lock file - web server handles it
      
      mcpServer.close();
      process.exit(0);
    });
    
    try {
      await mcpServer.start();
    } catch (error) {
      console.error('Failed to start MCP server:', error instanceof Error ? error.message : String(error));
      console.error('This usually means the web server API is not accessible.');
      console.error('Try running: pm2 restart task-notes-server');
      process.exit(1);
    }
  } else {
    // Run web server with auto-opening dashboard (traditional mode)
    console.log('Starting Task Notes Server with Web Dashboard...');
    
    const db = new Database();
    const webServer = new WebServer(db, 3020);
    
    // Start web server
    await webServer.start();
    
    // Auto-open dashboard in browser (web server handles lock management)
    const forceBrowser = args.includes('--force-browser');
    await webServer.openDashboardIfNeeded(forceBrowser);
    
    console.log('\nTo use as MCP server, run with --mcp flag or set NODE_ENV=mcp');
    console.log('Press Ctrl+C to stop the server');
    
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      
      // Web server will clean up its own lock file
      webServer.cleanupLockFile();
      
      db.close();
      process.exit(0);
    });
  }
}

main().catch(console.error);