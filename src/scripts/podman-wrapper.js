#!/usr/bin/env node

/**
 * Podman wrapper that gracefully handles when Podman is not available
 * Provides helpful error messages and fallback options
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

// Check if Podman is available
function isPodmanAvailable() {
  try {
    execSync('podman --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Docker is available as a fallback
function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args.join(' ');
  
  console.log('🐳 Container runtime check...');
  
  if (isPodmanAvailable()) {
    console.log('✅ Podman is available');
    
    // Execute the podman command
    const podman = spawn('podman', args, {
      stdio: 'inherit',
      shell: false
    });
    
    podman.on('exit', (code) => {
      process.exit(code || 0);
    });
    
    podman.on('error', (err) => {
      console.error('❌ Podman command failed:', err.message);
      process.exit(1);
    });
    
  } else if (isDockerAvailable() && command.includes('compose')) {
    console.log('⚠️  Podman not found, but Docker is available');
    console.log('📋 Converting podman-compose to docker compose...');
    
    // Convert podman-compose to docker compose
    const dockerArgs = args.map(arg => {
      if (arg === 'podman-compose') return 'compose';
      return arg;
    });
    
    const docker = spawn('docker', dockerArgs, {
      stdio: 'inherit',
      shell: false
    });
    
    docker.on('exit', (code) => {
      process.exit(code || 0);
    });
    
    docker.on('error', (err) => {
      console.error('❌ Docker command failed:', err.message);
      process.exit(1);
    });
    
  } else {
    console.log('⚠️  Container runtime not available');
    console.log('');
    console.log('📋 The command you tried to run requires Podman (or Docker):');
    console.log(`   ${command}`);
    console.log('');
    console.log('🔧 To install Podman:');
    console.log('   macOS:  brew install podman');
    console.log('   Linux:  sudo apt-get install podman  # or dnf/yum');
    console.log('   Windows: Download from https://podman.io');
    console.log('');
    console.log('💡 Alternative: Run without containers');
    console.log('   For development, you can use mock translations:');
    console.log('   nx run tsd-demo:serve');
    console.log('');
    console.log('   Or use an external LibreTranslate instance:');
    console.log('   LIBRETRANSLATE_URL=https://translate.example.com nx run tsd-demo:serve:http');
    console.log('');
    
    // Exit with special code to indicate container runtime missing
    process.exit(127);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('💥 Unexpected error:', err.message);
  process.exit(1);
});

main();