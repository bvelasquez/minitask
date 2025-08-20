#!/usr/bin/env node

import { TaskNotesMCPServer } from './mcp-server.js';
import { WebServer } from './web-server.js';
import { Database } from './database.js';
import open from 'open';

async function main() {
  // Check if we should run in MCP mode or web mode
  const args = process.argv.slice(2);
  const isMCPMode = args.includes('--mcp') || process.env.NODE_ENV === 'mcp';
  
  if (isMCPMode) {
    // Run MCP server with optional web dashboard
    console.error('Starting Task Notes MCP Server...');
    
    // Start web server first so MCP server can make API calls to it
    const db = new Database();
    const webServer = new WebServer(db, 3000);
    
    try {
      await webServer.start();
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
        mcpServer.close();
        db.close();
        process.exit(0);
      });
      
      await mcpServer.start();
    } catch (error) {
      console.error('Error: Could not start web server:', error);
      console.error('MCP server requires the web server to be running for API access');
      process.exit(1);
    }
  } else {
    // Run web server with auto-opening dashboard
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