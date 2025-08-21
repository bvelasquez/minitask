#!/usr/bin/env node

// Test script to demonstrate the improved MCP server startup behavior
// This simulates what happens when the MCP server starts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function isWebServerHealthy() {
  try {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testStartupBehavior() {
  console.log('🧪 Testing MCP Server Startup Behavior');
  console.log('=====================================\n');

  // Test 1: Check if web server is already running
  console.log('1. Checking if web server is already running...');
  const isHealthy = await isWebServerHealthy();
  
  if (isHealthy) {
    console.log('✅ Web server is already running and healthy!');
    console.log('   → MCP server would start immediately without hanging');
    console.log('   → No PM2 operations needed');
  } else {
    console.log('❌ Web server is not running or not healthy');
    
    // Test 2: Check PM2 status
    console.log('\n2. Checking PM2 status...');
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      const taskNotesApp = processes.find((p) => p.name === 'task-notes-server');
      
      if (!taskNotesApp) {
        console.log('   → No PM2 process found - would start new instance');
      } else if (taskNotesApp.pm2_env.status !== 'online') {
        console.log(`   → PM2 process exists but status is: ${taskNotesApp.pm2_env.status}`);
        console.log('   → Would restart the process');
      } else {
        console.log('   → PM2 process is online but API not responding');
        console.log('   → Would restart to fix the issue');
      }
    } catch (error) {
      console.log('   → PM2 not available or error checking status');
    }
  }

  console.log('\n🎯 Key Improvements:');
  console.log('   • Health checks prevent hanging on unresponsive servers');
  console.log('   • Timeouts ensure startup doesn\'t wait indefinitely');
  console.log('   • API validation before MCP server starts');
  console.log('   • Graceful handling of already-running servers');
  console.log('   • Clear error messages for troubleshooting');
}

testStartupBehavior().catch(console.error);