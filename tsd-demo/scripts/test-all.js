#!/usr/bin/env node

import { spawn } from 'child_process';
import { colors, wait } from './test-utils.js';

const tests = [
  {
    name: 'Local Package Link',
    script: 'test:link',
    setup: null,
    cleanup: null
  },
  {
    name: 'Development Mode',
    script: 'test:dev',
    setup: 'dev',
    cleanup: 'kill-port 5173'
  },
  {
    name: 'Preview Mode',
    script: 'test:preview', 
    setup: 'preview',
    cleanup: 'kill-port 4173'
  },
  {
    name: 'Production with Envoy',
    script: 'test:envoy',
    setup: 'prod:up',
    cleanup: 'prod:down'
  }
];

async function runProcess(command, background = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(`pnpm ${command}`, [], {
      stdio: background ? 'ignore' : 'inherit',
      shell: true,
      detached: background
    });

    if (background) {
      child.unref();
      // Give it time to start
      setTimeout(() => resolve(child), 3000);
    } else {
      child.on('error', (err) => {
        reject(new Error(`Command failed to start: ${command}\n${err.message}`));
      });
      
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed: ${command} (exit code ${code})`));
        }
      });
    }
  });
}

async function killProcess(port) {
  try {
    await runProcess(`kill-port ${port}`);
  } catch {
    // Port might not be in use
  }
}

async function runAllTests() {
  console.log(`${colors.blue}Running All TSd Demo Tests${colors.reset}\n`);
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n${colors.yellow}Starting: ${test.name}${colors.reset}`);
    
    let setupProcess = null;
    
    try {
      // Setup
      if (test.setup) {
        console.log(`Setting up ${test.setup}...`);
        setupProcess = await runProcess(test.setup, true);
        await wait(5000); // Wait for services to start
      }
      
      // Run test
      await runProcess(test.script);
      
      results.push({ name: test.name, passed: true });
      console.log(`${colors.green}✓ ${test.name} passed${colors.reset}`);
      
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
      console.log(`${colors.red}✗ ${test.name} failed: ${error.message}${colors.reset}`);
      
    } finally {
      // Cleanup
      if (test.cleanup) {
        console.log(`Cleaning up...`);
        if (test.cleanup.includes('kill-port')) {
          const port = test.cleanup.split(' ')[1];
          await killProcess(port);
        } else {
          try {
            await runProcess(test.cleanup);
          } catch {
            // Cleanup errors are not critical
          }
        }
      }
      
      if (setupProcess) {
        try {
          process.kill(-setupProcess.pid);
        } catch {
          // Process might already be dead
        }
      }
      
      // Wait between tests
      await wait(2000);
    }
  }
  
  // Summary
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    const status = r.passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} ${r.name}`);
    if (r.error) {
      console.log(`  ${colors.red}${r.error}${colors.reset}`);
    }
  });
  
  console.log(`\nTotal: ${colors.green}${passed} passed${colors.reset}, ${colors.red}${failed} failed${colors.reset}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\nCleaning up...');
  await killProcess(5173);
  await killProcess(4173);
  await runProcess('prod:down').catch(() => {});
  process.exit(0);
});

runAllTests().catch(error => {
  console.error(`${colors.red}Test runner failed:${colors.reset}`, error);
  process.exit(1);
});