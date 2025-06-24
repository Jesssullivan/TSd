#!/usr/bin/env node

/**
 * NPM Publication Script for TSd Package
 * 
 * This script transforms the local @tinyland/tsd package for publication to npm as @tummycrypt/tsd
 * It handles:
 * - Package name transformation
 * - Dependency remapping from local @tinyland/* to appropriate npm packages
 * - Registry configuration
 * - Clean build and publication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const log = (message) => console.log(`[TSd NPM Publish] ${message}`);
const error = (message) => console.error(`[TSd NPM Publish ERROR] ${message}`);

class TsdNpmPublisher {
  constructor() {
    this.packageRoot = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.packageRoot, 'package.json');
    this.backupPath = path.join(this.packageRoot, 'package.json.backup');
    this.originalPackageJson = null;
  }

  async run() {
    try {
      log('Starting TSd npm publication process...');
      
      // 1. Backup original package.json
      await this.backupPackageJson();
      
      // 2. Transform package for npm
      await this.transformPackageForNpm();
      
      // 3. Build package
      await this.buildPackage();
      
      // 4. Publish to npm
      await this.publishToNpm();
      
      log('✅ TSd package successfully published to npm!');
      
    } catch (err) {
      error(`Publication failed: ${err.message}`);
      throw err;
    } finally {
      // Always restore original package.json
      await this.restorePackageJson();
    }
  }

  async backupPackageJson() {
    log('📦 Backing up original package.json...');
    this.originalPackageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    fs.copyFileSync(this.packageJsonPath, this.backupPath);
  }

  async transformPackageForNpm() {
    log('🔄 Transforming package for npm publication...');
    
    const packageJson = { ...this.originalPackageJson };
    
    // Transform package name
    packageJson.name = '@tummycrypt/tsd';
    
    // Set npm registry and public access
    packageJson.publishConfig = {
      registry: 'https://registry.npmjs.org',
      access: 'public'
    };
    
    // Transform any @tinyland/* dependencies to appropriate npm equivalents
    if (packageJson.dependencies) {
      packageJson.dependencies = this.transformDependencies(packageJson.dependencies);
    }
    
    if (packageJson.peerDependencies) {
      // Keep peerDependencies as-is since they're standard packages
      // but transform any @tinyland/* references
      packageJson.peerDependencies = this.transformDependencies(packageJson.peerDependencies);
    }
    
    // Update repository URL for tummycrypt
    if (packageJson.repository) {
      packageJson.repository.url = 'https://github.com/tummycrypt/tsd.git';
      delete packageJson.repository.directory; // Remove monorepo-specific directory
    }
    
    // Update homepage
    packageJson.homepage = 'https://github.com/tummycrypt/tsd';
    
    // Write transformed package.json
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
    log(`📝 Package transformed: ${packageJson.name}@${packageJson.version}`);
  }

  transformDependencies(deps) {
    const transformed = { ...deps };
    
    // Map @tinyland/* packages to their npm equivalents
    const dependencyMap = {
      '@tinyland/sveltekit': '@sveltejs/kit',
      // Add more mappings as needed
    };
    
    Object.keys(transformed).forEach(dep => {
      if (dependencyMap[dep]) {
        log(`🔗 Mapping dependency: ${dep} -> ${dependencyMap[dep]}`);
        transformed[dependencyMap[dep]] = transformed[dep];
        delete transformed[dep];
      } else if (dep.startsWith('@tinyland/')) {
        log(`⚠️  Warning: Unmapped @tinyland dependency: ${dep}`);
      }
    });
    
    return transformed;
  }

  async buildPackage() {
    log('🔨 Building package for npm...');
    try {
      // Change to package directory and build
      process.chdir(this.packageRoot);
      execSync('node build.js', { stdio: 'inherit' });
      log('✅ Package built successfully');
    } catch (err) {
      throw new Error(`Build failed: ${err.message}`);
    }
  }

  async publishToNpm() {
    log('🚀 Publishing to npm registry...');
    
    try {
      // Check npm authentication
      execSync('npm whoami', { stdio: 'pipe' });
      log('✅ npm authentication verified');
      
      // Publish to npm
      execSync('npm publish', { 
        stdio: 'inherit',
        cwd: this.packageRoot 
      });
      
      log('✅ Package published to npm successfully');
      
    } catch (err) {
      const errorOutput = err.stderr?.toString() || err.stdout?.toString() || err.message;
      
      if (errorOutput.includes('You cannot publish over the previously published versions')) {
        log('📦 Version already exists, incrementing patch version...');
        
        try {
          const versionResult = execSync('npm version patch --no-git-tag-version', { 
            cwd: this.packageRoot,
            stdio: 'pipe',
            encoding: 'utf8'
          });
          
          const newVersion = versionResult.trim().replace('v', '');
          log(`📝 New version: ${newVersion}`);
          
          // Try publishing again
          execSync('npm publish', { 
            stdio: 'inherit',
            cwd: this.packageRoot 
          });
          log('✅ Package published to npm with incremented version');
          
        } catch (versionErr) {
          throw new Error(`Version increment and publish failed: ${versionErr.message}`);
        }
      } else {
        throw new Error(`npm publish failed: ${errorOutput}`);
      }
    }
  }

  async restorePackageJson() {
    log('🔄 Restoring original package.json...');
    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.packageJsonPath);
      fs.unlinkSync(this.backupPath);
      log('✅ Original package.json restored');
    }
  }
}

// CLI interface
if (require.main === module) {
  const publisher = new TsdNpmPublisher();
  
  publisher.run()
    .then(() => {
      log('🎉 TSd npm publication completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      error(`Publication failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = TsdNpmPublisher;