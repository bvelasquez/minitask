#!/usr/bin/env node

import { TaskNotesMCPServer } from './mcp-server.js';
import { WebServer } from './web-server.js';
import { Database } from './database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import open from 'open';

const execAsync = promisify(exec);

async function ensureWebServerRunning(): Promise<boolean> {
  try {
    // Check if PM2 app is running
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    const taskNotesApp = processes.find((p: any) => p.name === 'task-notes-server');
    
    if (!taskNotesApp || taskNotesApp.pm2_env.status !== 'online') {
      console.error('Starting task-notes web server with PM2...');
      await execAsync('pm2 start ecosystem.config.cjs');
      
      // Wait for server to be ready
      console.error('Waiting for server to start...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify it started
      const { stdout: newStdout } = await execAsync('pm2 jlist');
      const newProcesses = JSON.parse(newStdout);
      const newTaskNotesApp = newProcesses.find((p: any) => p.name === 'task-notes-server');
      
      if (newTaskNotesApp && newTaskNotesApp.pm2_env.status === 'online') {
        console.error('Web server started successfully with PM2');
        return true;
      } else {
        console.error('Failed to start web server with PM2');
        return false;
      }
    } else {
      console.error('Task-notes web server already running via PM2');
      return true;
    }
  } catch (error) {
    console.error('Error managing PM2 server:', error);
    return false;
  }
}

async function main() {
  // Check if we should run in MCP mode or web mode
  const args = process.argv.slice(2);
  const isMCPMode = args.includes('--mcp') || process.env.NODE_ENV === 'mcp';
  
  if (isMCPMode) {
    // Run MCP server with PM2-managed web dashboard
    console.error('Starting Task Notes MCP Server...');
    
    // Ensure web server is running via PM2
    const webServerRunning = await ensureWebServerRunning();
    
    if (!webServerRunning) {
      console.error('Error: Could not start web server via PM2');
      console.error('MCP server requires the web server to be running for API access');
      process.exit(1);
    }
    
    console.error('Web dashboard available at: http://localhost:3000');
    
    // Now create MCP server that will use the web server's API
    const mcpServer = new TaskNotesMCPServer('http://localhost:3000/api');
    
    // Optionally auto-open dashboard (can be disabled with --no-browser flag)
    if (!args.includes('--no-browser')) {
      try {
        await open('http://localhost:3000');
        console.error('Dashboard opened in your default browser');
      } catch (error) {
        console.error('Could not auto-open browser. Please visit: http://localhost:3000');
      }
    }
    
    process.on('SIGINT', () => {
      console.error('Shutting down MCP server...');
      console.error('Note: Web server will continue running via PM2');
      console.error('Use "pm2 stop task-notes-server" to stop the web server');
      mcpServer.close();
      process.exit(0);
    });
    
    await mcpServer.start();
  } else {
    // Run web server with auto-opening dashboard (traditional mode)
    console.log('Starting Task Notes Server with Web Dashboard...');
    
    const db = new Database();
    const webServer = new WebServer(db, 3000);
    
    // Start web server
    await webServer.start();
    
    // Auto-open dashboard in browser
    try {
      await open('http://localhost:3000');
      console.log('Dashboard opened in your default browser');
    } catch (error) {
      console.log('Could not auto-open browser. Please visit: http://localhost:3000');
    }
    
    console.log('\nTo use as MCP server, run with --mcp flag or set NODE_ENV=mcp');
    console.log('Press Ctrl+C to stop the server');
    
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      db.close();
      process.exit(0);
    });
  }
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});