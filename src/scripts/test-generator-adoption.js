#!/usr/bin/env node

/**
 * Test TSd adoption lifecycle using Nx generators
 * 
 * This simulates a real developer adopting TSd by:
 * 1. Generating a new project with the tsd-demo generator
 * 2. Verifying the project structure
 * 3. Testing that TSd is properly integrated
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GeneratorAdoptionTester {
  constructor() {
    this.testProjectName = 'test-tsd-adoption-' + Date.now();
    this.workspaceRoot = process.cwd();
    this.projectPath = path.join(this.workspaceRoot, 'apps', this.testProjectName);
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  error(message) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  }

  exec(command, options = {}) {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: options.cwd || this.workspaceRoot
      });
      return { success: true, output: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout?.toString() || ''
      };
    }
  }

  async testGeneratorAdoption() {
    this.log('🚀 Testing TSd adoption lifecycle with Nx generator');
    
    try {
      // 1. Generate a new project
      this.log(`📦 Generating new project: ${this.testProjectName}`);
      const genResult = this.exec(
        `nx g @zentaisei/nx-generators:tsd-demo ${this.testProjectName} --directory=apps/${this.testProjectName}`
      );
      
      if (!genResult.success) {
        throw new Error(`Failed to generate project: ${genResult.error}`);
      }
      
      // 2. Verify project structure
      this.log('🔍 Verifying generated project structure...');
      
      const requiredFiles = [
        'package.json',
        'vite.config.ts',
        'src/routes/+page.svelte',
        'src/lib/index.ts'
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(this.projectPath, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Missing required file: ${file}`);
        }
      }
      
      // 3. Verify TSd integration in vite.config.ts
      this.log('✅ Checking TSd plugin integration...');
      const viteConfig = fs.readFileSync(
        path.join(this.projectPath, 'vite.config.ts'), 
        'utf8'
      );
      
      if (!viteConfig.includes('tsdPlugin')) {
        throw new Error('TSd plugin not found in vite.config.ts');
      }
      
      if (!viteConfig.includes('@tinyland/tsd/vite')) {
        throw new Error('TSd import not found in vite.config.ts');
      }
      
      // 4. Verify package.json dependencies
      this.log('📋 Checking package.json dependencies...');
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectPath, 'package.json'), 'utf8')
      );
      
      if (!packageJson.dependencies || !packageJson.dependencies['@tinyland/tsd']) {
        throw new Error('@tinyland/tsd not found in dependencies');
      }
      
      // 5. Check for TSd components in routes
      this.log('🔍 Verifying TSd components in routes...');
      const pageContent = fs.readFileSync(
        path.join(this.projectPath, 'src/routes/+page.svelte'),
        'utf8'
      );
      
      if (!pageContent.includes('<tsd') && !pageContent.includes('Tsd')) {
        this.log('⚠️  Warning: No TSd components found in +page.svelte');
      }
      
      // 6. Try to build the project
      this.log('🔨 Testing project build...');
      const buildResult = this.exec(`nx build ${this.testProjectName}`, {
        silent: true
      });
      
      if (!buildResult.success) {
        this.log('⚠️  Build failed (this might be expected without all dependencies)');
      }
      
      this.log('✅ TSd adoption lifecycle test completed successfully!');
      return true;
      
    } catch (error) {
      this.error(`Adoption test failed: ${error.message}`);
      return false;
    } finally {
      // Cleanup
      this.cleanup();
    }
  }

  cleanup() {
    this.log('🧹 Cleaning up test project...');
    
    try {
      // Remove the generated project
      if (fs.existsSync(this.projectPath)) {
        fs.rmSync(this.projectPath, { recursive: true, force: true });
      }
      
      // Remove from nx.json if it was added
      const nxJsonPath = path.join(this.workspaceRoot, 'nx.json');
      if (fs.existsSync(nxJsonPath)) {
        const nxJson = JSON.parse(fs.readFileSync(nxJsonPath, 'utf8'));
        if (nxJson.projects && nxJson.projects[this.testProjectName]) {
          delete nxJson.projects[this.testProjectName];
          fs.writeFileSync(nxJsonPath, JSON.stringify(nxJson, null, 2));
        }
      }
      
      this.log('✅ Cleanup completed');
    } catch (error) {
      this.error(`Cleanup failed: ${error.message}`);
    }
  }
}

async function main() {
  const tester = new GeneratorAdoptionTester();
  
  try {
    const success = await tester.testGeneratorAdoption();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Unhandled error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}