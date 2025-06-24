#!/usr/bin/env node

/**
 * Podman Doctor - Diagnose and fix Podman installation issues
 * Can install/reinstall Podman Desktop and fix connection problems
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (err) {
    return null;
  }
}

function execLive(cmd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, { shell: true, stdio: 'inherit' });
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function checkBrew() {
  const hasBrew = exec('which brew');
  if (!hasBrew) {
    console.log('❌ Homebrew is not installed');
    console.log('📋 Homebrew is required to install Podman on macOS');
    
    const install = await question('Would you like to install Homebrew? (y/n) ');
    if (install.toLowerCase() === 'y') {
      console.log('🚀 Installing Homebrew...');
      const installCmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
      await execLive(installCmd);
      
      // Add Homebrew to PATH for Apple Silicon Macs
      if (os.arch() === 'arm64') {
        console.log('📋 Adding Homebrew to PATH for Apple Silicon...');
        exec('echo \'eval "$(/opt/homebrew/bin/brew shellenv)"\' >> ~/.zprofile');
        exec('eval "$(/opt/homebrew/bin/brew shellenv)"');
      }
    }
    return false;
  }
  return true;
}

async function diagnoseAndFix() {
  console.log('🔍 Podman Doctor - Diagnosing Podman installation...\n');
  
  const platform = os.platform();
  
  if (platform !== 'darwin') {
    console.log('⚠️  This script is currently optimized for macOS');
    console.log('   For Linux, use your package manager:');
    console.log('   Ubuntu/Debian: sudo apt-get install podman podman-compose');
    console.log('   Fedora/RHEL: sudo dnf install podman podman-compose');
    return;
  }
  
  // Check Homebrew first
  if (!await checkBrew()) {
    console.log('⚠️  Please install Homebrew first and run this script again');
    return;
  }
  
  // 1. Check Podman installation
  const podmanVersion = exec('podman --version');
  const hasPodman = !!podmanVersion;
  
  if (!hasPodman) {
    console.log('❌ Podman is not installed');
    const install = await question('Would you like to install Podman? (y/n) ');
    
    if (install.toLowerCase() === 'y') {
      console.log('🚀 Installing Podman...');
      await execLive('brew install podman');
    }
  } else {
    console.log(`✅ Podman installed: ${podmanVersion.trim()}`);
  }
  
  // 2. Check Podman Desktop (optional but helpful)
  const hasPodmanDesktop = exec('ls /Applications/Podman\\ Desktop.app 2>/dev/null');
  
  if (!hasPodmanDesktop) {
    console.log('📋 Podman Desktop is not installed (optional GUI)');
    const install = await question('Would you like to install Podman Desktop for easier management? (y/n) ');
    
    if (install.toLowerCase() === 'y') {
      console.log('🚀 Installing Podman Desktop...');
      await execLive('brew install --cask podman-desktop');
    }
  } else {
    console.log('✅ Podman Desktop is installed');
  }
  
  // 3. Check podman-compose
  const podmanComposeVersion = exec('podman-compose --version');
  
  if (!podmanComposeVersion) {
    console.log('❌ Podman Compose is not installed');
    const install = await question('Would you like to install podman-compose? (y/n) ');
    
    if (install.toLowerCase() === 'y') {
      console.log('🚀 Installing podman-compose...');
      await execLive('brew install podman-compose');
    }
  } else {
    console.log(`✅ Podman Compose installed: ${podmanComposeVersion.trim()}`);
  }
  
  // 4. Check machine status and connection
  console.log('\n🔍 Checking Podman machine status...');
  
  const machineList = exec('podman machine list');
  if (machineList) {
    console.log(machineList);
  }
  
  // Test connection
  const canConnect = exec('podman ps', { timeout: 5000 });
  
  if (!canConnect) {
    console.log('❌ Cannot connect to Podman daemon');
    
    const hasRunningMachine = machineList && machineList.includes('Currently running');
    
    if (hasRunningMachine) {
      console.log('🔧 Machine shows as running but connection failed');
      console.log('   This is a known issue with Podman on macOS\n');
      
      const fix = await question('Would you like to try to fix the connection? (y/n) ');
      
      if (fix.toLowerCase() === 'y') {
        console.log('\n🔧 Attempting to fix Podman connection...');
        
        // Try restart first
        console.log('1️⃣ Restarting Podman machine...');
        exec('podman machine stop');
        await new Promise(resolve => setTimeout(resolve, 2000));
        exec('podman machine start');
        
        console.log('⏳ Waiting for machine to fully start (30 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Test again
        const nowWorks = exec('podman ps', { timeout: 5000 });
        
        if (nowWorks) {
          console.log('✅ Connection fixed! Podman is now working');
        } else {
          console.log('⚠️  Restart didn\'t fix the issue');
          
          const reinstall = await question('Would you like to recreate the Podman machine? (y/n) ');
          
          if (reinstall.toLowerCase() === 'y') {
            console.log('\n🔧 Recreating Podman machine...');
            console.log('   This will remove all containers and images');
            
            exec('podman machine rm -f podman-machine-default');
            exec('podman machine init');
            exec('podman machine start');
            
            console.log('⏳ Waiting for new machine to start (30 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            const finalCheck = exec('podman ps', { timeout: 5000 });
            if (finalCheck) {
              console.log('✅ Podman machine recreated successfully!');
            } else {
              console.log('❌ Still having issues. You may need to:');
              console.log('   1. Restart your computer');
              console.log('   2. Check firewall/security settings');
              console.log('   3. Reinstall Podman completely');
            }
          }
        }
      }
    } else {
      console.log('📋 No Podman machine exists');
      
      const create = await question('Would you like to create a Podman machine? (y/n) ');
      
      if (create.toLowerCase() === 'y') {
        console.log('🚀 Creating Podman machine...');
        await execLive('podman machine init');
        await execLive('podman machine start');
        
        console.log('✅ Podman machine created and started');
      }
    }
  } else {
    console.log('✅ Podman daemon is accessible');
  }
  
  // 5. Final summary
  console.log('\n📊 Summary:');
  
  const finalChecks = {
    'Podman': !!exec('podman --version'),
    'Podman Compose': !!exec('podman-compose --version'),
    'Podman Machine': !!exec('podman machine list'),
    'Connection': !!exec('podman ps', { timeout: 5000 })
  };
  
  Object.entries(finalChecks).forEach(([name, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${name}`);
  });
  
  if (Object.values(finalChecks).every(v => v)) {
    console.log('\n🎉 Everything is working! You can now run:');
    console.log('   nx run tsd-demo:compose:up');
    console.log('   nx run tsd:eval:container');
  } else {
    console.log('\n⚠️  Some issues remain. For now, you can run without containers:');
    console.log('   nx run tsd-demo:serve');
  }
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  diagnoseAndFix().catch(err => {
    console.error('💥 Error:', err.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = { diagnoseAndFix };