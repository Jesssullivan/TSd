#!/usr/bin/env node

/**
 * Update all podman-compose commands to use the safe wrapper
 */

const fs = require('fs');
const path = require('path');

function updateProjectJson(filePath) {
  console.log(`📋 Updating ${filePath}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  
  let updated = false;
  
  // Walk through all targets
  if (json.targets) {
    Object.keys(json.targets).forEach(targetName => {
      const target = json.targets[targetName];
      
      if (target.options) {
        // Check single command
        if (target.options.command && target.options.command.includes('podman-compose')) {
          const originalCmd = target.options.command;
          // Only replace the podman-compose command, not the rest of the path
          target.options.command = target.options.command.replace(
            /^podman-compose/,
            '../../scripts/podman-compose-safe.sh'
          );
          
          if (originalCmd !== target.options.command) {
            console.log(`  ✅ Updated ${targetName}`);
            updated = true;
          }
        }
        
        // Check commands array
        if (target.options.commands && Array.isArray(target.options.commands)) {
          target.options.commands = target.options.commands.map(cmd => {
            if (cmd.includes('podman-compose')) {
              const newCmd = cmd.replace(/podman-compose/g, '../../scripts/podman-compose-safe.sh');
              if (newCmd !== cmd) {
                console.log(`  ✅ Updated ${targetName} command: ${newCmd}`);
                updated = true;
              }
              return newCmd;
            }
            return cmd;
          });
        }
      }
      
      // Check configurations
      if (target.configurations) {
        Object.keys(target.configurations).forEach(configName => {
          const config = target.configurations[configName];
          if (config.command && config.command.includes('podman-compose')) {
            const originalCmd = config.command;
            config.command = config.command.replace(
              /podman-compose/g,
              '../../scripts/podman-compose-safe.sh'
            );
            
            if (originalCmd !== config.command) {
              console.log(`  ✅ Updated ${targetName}:${configName}: ${config.command}`);
              updated = true;
            }
          }
        });
      }
    });
  }
  
  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
    console.log(`  ✅ File updated successfully`);
  } else {
    console.log(`  ℹ️  No podman-compose commands found`);
  }
}

// Main
console.log('🔧 Updating podman-compose commands to use safe wrapper...\n');

const projectFiles = [
  path.join(__dirname, '../../../apps/tsd-demo/project.json'),
  path.join(__dirname, '../../../apps/tsd-demo-e2e/project.json')
];

projectFiles.forEach(file => {
  if (fs.existsSync(file)) {
    updateProjectJson(file);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n✅ Done! Podman commands will now fail gracefully with helpful messages.');