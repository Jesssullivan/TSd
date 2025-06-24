#!/usr/bin/env node

/**
 * TSd Package Adoption Lifecycle Test
 * 
 * Validates:
 * - Package registry integration
 * - Dependency resolution (@tinyland/* namespace)
 * - Version compatibility
 * - Security compliance
 * - Verdaccio local registry functionality
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AdoptionLifecycleTester {
  constructor() {
    this.results = [];
    this.registryUrl = 'http://localhost:4873';
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  error(message) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  }

  async runCommand(command, options = {}) {
    const { silent = false, returnOutput = false } = options;
    
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit',
        cwd: process.cwd()
      });
      
      if (returnOutput) {
        return result;
      }
      
      return { success: true, output: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout?.toString() || ''
      };
    }
  }

  async testRegistryConnection() {
    this.log('📡 Testing local registry connection...');
    
    try {
      const response = await fetch(`${this.registryUrl}/-/ping`);
      if (response.ok) {
        this.log('✅ Registry is accessible');
        return true;
      }
    } catch (error) {
      this.error('Registry not accessible. Starting Verdaccio...');
      await this.runCommand('nx run tsd-demo:compose:registry:up');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Retry
      try {
        const response = await fetch(`${this.registryUrl}/-/ping`);
        if (response.ok) {
          this.log('✅ Registry started and accessible');
          return true;
        }
      } catch (error) {
        this.error('Failed to start registry');
        return false;
      }
    }
    
    return false;
  }

  async testPackagePublication() {
    this.log('📦 Testing @tinyland/tsd package publication...');
    
    // Build the package first
    const buildResult = await this.runCommand('nx run tsd:build', { silent: true });
    if (!buildResult.success) {
      this.error('Package build failed');
      return false;
    }
    
    // Check if package is already published
    try {
      const response = await fetch(`${this.registryUrl}/@tinyland/tsd`);
      if (response.ok) {
        this.log('✅ Package already published to local registry');
        return true;
      }
    } catch (error) {
      // Package not found, need to publish
    }
    
    // Publish to local registry
    const publishResult = await this.runCommand(
      `cd packages/tsd && npm publish --registry ${this.registryUrl}`,
      { silent: true }
    );
    
    if (publishResult.success || publishResult.error?.includes('already exists')) {
      this.log('✅ Package published/available in local registry');
      return true;
    }
    
    this.error('Failed to publish package');
    return false;
  }

  async testDependencyResolution() {
    this.log('🔍 Testing @tinyland/* namespace dependency resolution...');
    
    // Create a test project
    const testDir = path.join(process.cwd(), '.adoption-test');
    await fs.mkdir(testDir, { recursive: true });
    
    // Create package.json
    const packageJson = {
      name: 'tsd-adoption-test',
      version: '1.0.0',
      dependencies: {
        '@tinyland/tsd': 'latest'
      }
    };
    
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create .npmrc
    await fs.writeFile(
      path.join(testDir, '.npmrc'),
      `registry=${this.registryUrl}\n@tinyland:registry=${this.registryUrl}`
    );
    
    // Try to install
    const installResult = await this.runCommand(
      `cd ${testDir} && npm install`,
      { silent: true }
    );
    
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
    
    if (installResult.success) {
      this.log('✅ Dependency resolution working correctly');
      return true;
    }
    
    this.error('Dependency resolution failed');
    return false;
  }

  async testSecurityCompliance() {
    this.log('🔒 Testing security compliance...');
    
    // Check package.json for security metadata
    const packageJsonPath = path.join(process.cwd(), 'packages/tsd/package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    const checks = {
      'Repository field': !!packageJson.repository,
      'License field': !!packageJson.license,
      'Author field': !!packageJson.author,
      'Homepage field': !!packageJson.homepage,
      '_zentaisei metadata': !!packageJson._zentaisei
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        this.log(`  ✅ ${check}`);
      } else {
        this.error(`  ❌ ${check}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async testVersionCompatibility() {
    this.log('🔄 Testing version compatibility...');
    
    // Check if all @tinyland dependencies use compatible versions
    const output = await this.runCommand('npm list --depth=0 --json', { 
      silent: true, 
      returnOutput: true 
    });
    
    try {
      const deps = JSON.parse(output);
      const tinylandDeps = Object.keys(deps.dependencies || {})
        .filter(name => name.startsWith('@tinyland/'));
      
      if (tinylandDeps.length > 0) {
        this.log(`  Found ${tinylandDeps.length} @tinyland dependencies`);
        
        // Check for version conflicts
        const conflictResult = await this.runCommand(
          'npm ls @tinyland/* --depth=0',
          { silent: true }
        );
        
        if (conflictResult.success) {
          this.log('✅ No version conflicts detected');
          return true;
        }
      } else {
        this.log('✅ No @tinyland dependencies to check');
        return true;
      }
    } catch (error) {
      this.error('Failed to check version compatibility');
      return false;
    }
    
    return false;
  }

  async runTests() {
    this.log('🚀 Starting TSd Package Adoption Lifecycle Tests\n');
    
    const tests = [
      { name: 'Registry Connection', fn: () => this.testRegistryConnection() },
      { name: 'Package Publication', fn: () => this.testPackagePublication() },
      { name: 'Dependency Resolution', fn: () => this.testDependencyResolution() },
      { name: 'Security Compliance', fn: () => this.testSecurityCompliance() },
      { name: 'Version Compatibility', fn: () => this.testVersionCompatibility() }
    ];
    
    for (const test of tests) {
      this.log(`\n=== ${test.name} ===`);
      const passed = await test.fn();
      this.results.push({ name: test.name, passed });
    }
    
    // Summary
    this.log('\n📊 Adoption Lifecycle Test Summary:');
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    for (const result of this.results) {
      this.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`);
    }
    
    this.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
    
    return passed === total;
  }
}

async function main() {
  const tester = new AdoptionLifecycleTester();
  
  try {
    const success = await tester.runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Adoption lifecycle test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}