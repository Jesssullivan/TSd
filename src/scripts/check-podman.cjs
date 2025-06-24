#!/usr/bin/env node

/**
 * Check Podman availability and provide helpful diagnostics
 */

const { execSync } = require('child_process');

async function checkPodman() {
  console.log('🐳 Checking Podman installation and connectivity...\n');
  
  let hasIssues = false;
  
  // 1. Check if podman is installed
  try {
    const version = execSync('podman --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Podman installed: ${version}`);
  } catch (err) {
    console.log('❌ Podman is not installed');
    console.log('   Install with: brew install podman');
    hasIssues = true;
    return;
  }
  
  // 2. Check if podman-compose is installed
  try {
    const version = execSync('podman-compose --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Podman Compose installed: ${version}`);
  } catch (err) {
    console.log('❌ Podman Compose is not installed');
    console.log('   Install with: brew install podman-compose');
    hasIssues = true;
  }
  
  // 3. Check machine status
  try {
    const machines = execSync('podman machine list', { encoding: 'utf8' });
    console.log('\n📋 Podman machines:');
    console.log(machines);
    
    // Check if any machine is running
    if (!machines.includes('Currently running')) {
      console.log('⚠️  No podman machine is running');
      console.log('   Start with: podman machine start');
      hasIssues = true;
    }
  } catch (err) {
    console.log('❌ Could not list podman machines');
    hasIssues = true;
  }
  
  // 4. Test connection
  try {
    execSync('podman ps', { encoding: 'utf8', timeout: 5000 });
    console.log('✅ Podman daemon is accessible\n');
  } catch (err) {
    console.log('❌ Cannot connect to Podman daemon');
    
    if (err.message.includes('connection refused')) {
      console.log('\n🔧 Connection refused. Try these steps:');
      console.log('   1. podman machine stop');
      console.log('   2. podman machine start');
      console.log('   3. Wait 30 seconds for the machine to fully start');
      console.log('   4. Try again\n');
      
      console.log('   If that doesn\'t work:');
      console.log('   1. podman machine rm podman-machine-default');
      console.log('   2. podman machine init');
      console.log('   3. podman machine start\n');
    }
    hasIssues = true;
  }
  
  // 5. Summary
  if (!hasIssues) {
    console.log('🎉 Podman is ready to use!');
    console.log('\nYou can now run container commands like:');
    console.log('   nx run tsd-demo:compose:up');
    console.log('   nx run tsd:eval:container');
  } else {
    console.log('⚠️  Please fix the issues above before running container commands');
  }
  
  return !hasIssues;
}

// Run if called directly
if (require.main === module) {
  checkPodman().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkPodman };