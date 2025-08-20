#!/usr/bin/env node

import { WebServer } from './web-server.js';
import { Database } from './database.js';

async function startStandaloneServer() {
  console.log('Starting Task Notes Web Server (standalone mode)...');
  
  const db = new Database();
  const webServer = new WebServer(db, 3000);
  
  try {
    await webServer.start();
    console.log('Task Notes Web Server is running at: http://localhost:3000');
    console.log('Dashboard available at: http://localhost:3000');
    console.log('Press Ctrl+C to stop the server');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down web server...');
      db.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM, shutting down web server...');
      db.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start web server:', error);
    process.exit(1);
  }
}

startStandaloneServer().catch((error) => {
  console.error('Failed to start standalone web server:', error);
  process.exit(1);
});