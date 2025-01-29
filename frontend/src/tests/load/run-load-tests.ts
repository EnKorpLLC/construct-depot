import { exec } from 'child_process';
import { promisify } from 'util';
import { webSocketLoadTest } from './websocket-test';

const execAsync = promisify(exec);

async function runLoadTests() {
  try {
    console.log('Starting Load Tests...\n');
    
    // Run k6 load tests
    console.log('Running k6 HTTP Load Tests...');
    const { stdout, stderr } = await execAsync('k6 run load-test.js');
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n----------------------------------------\n');
    
    // Run WebSocket load tests
    console.log('Running WebSocket Load Tests...');
    await webSocketLoadTest.runTest(1000, 4); // 1000 connections across 4 workers
    
    console.log('\nAll Load Tests Completed!');
    
  } catch (error) {
    console.error('Error running load tests:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runLoadTests();
}

export { runLoadTests }; 