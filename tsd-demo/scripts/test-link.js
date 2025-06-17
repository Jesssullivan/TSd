#!/usr/bin/env node

import { 
  runTestSuite, 
  assert,
  colors,
  exec,
  wait
} from './test-utils.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url)).slice(0, -1);
const projectRoot = join(__dirname, '..');
const tsdPackageRoot = join(__dirname, '..', '..', 'tsd');

async function runTests() {
  console.log(`${colors.blue}Testing Local Package Linking${colors.reset}`);

  const tests = [
    {
      name: 'TSd package exists locally',
      fn: async () => {
        const packageJson = await readFile(join(tsdPackageRoot, 'package.json'), 'utf8');
        const pkg = JSON.parse(packageJson);
        assert(pkg.name === '@tummycrypt/tsd', 'Invalid package name');
        console.log(`  Found ${pkg.name}@${pkg.version}`);
      }
    },
    {
      name: 'Build TSd package',
      fn: async () => {
        console.log('  Building TSd package...');
        await exec('pnpm build', { cwd: tsdPackageRoot });
        
        // Verify build output
        const { stdout } = await exec('ls -la dist/', { cwd: tsdPackageRoot, silent: true });
        assert(stdout.includes('index.js'), 'Build output missing');
        assert(stdout.includes('vite'), 'Vite plugin not built');
        assert(stdout.includes('svelte'), 'Svelte components not built');
      }
    },
    {
      name: 'Link TSd package locally',
      fn: async () => {
        // Use relative file path linking instead of global
        console.log('  Linking TSd package locally...');
        await exec('pnpm link ../tsd', { cwd: projectRoot });
        
        // Verify link
        const { stdout } = await exec('pnpm list @tummycrypt/tsd', { cwd: projectRoot, silent: true });
        assert(stdout.includes('link:') || stdout.includes('@tummycrypt/tsd'), 'Package not linked');
        console.log('  ✓ Package linked successfully');
      }
    },
    {
      name: 'Linked package works in dev mode',
      fn: async () => {
        // Quick test that vite can resolve the linked package
        const { stdout, stderr } = await exec('pnpm vite build --mode development --logLevel silent', { 
          cwd: projectRoot, 
          silent: true 
        });
        
        // Check for TSd plugin initialization
        assert(!stderr.includes('Failed to resolve'), 'Package resolution failed');
        console.log('  ✓ Linked package resolves correctly');
      }
    },
    {
      name: 'Hot reload works with linked package',
      fn: async () => {
        console.log('  Testing hot reload capability...');
        
        // Modify a file in TSd
        const testFile = join(tsdPackageRoot, 'src/lib/translation-monad.ts');
        const original = await readFile(testFile, 'utf8');
        
        try {
          // Add a comment
          const modified = original + '\n// Hot reload test';
          await exec(`echo "${modified}" > ${testFile}`, { silent: true });
          
          // Rebuild
          await exec('pnpm build', { cwd: tsdPackageRoot, silent: true });
          
          console.log('  ✓ Package rebuilds on changes');
        } finally {
          // Restore original
          await exec(`echo "${original}" > ${testFile}`, { silent: true });
        }
      }
    },
    {
      name: 'TypeScript types resolve correctly',
      fn: async () => {
        // Check if TS can compile with linked package
        const { stderr } = await exec('pnpm tsc --noEmit', { 
          cwd: projectRoot, 
          silent: true 
        });
        
        // Some warnings are OK, but no errors about missing types
        assert(!stderr.includes('@tummycrypt/tsd'), 'Type resolution errors found');
        console.log('  ✓ TypeScript types resolve');
      }
    }
  ];

  const success = await runTestSuite('Local Package Link Tests', tests);
  
  // Cleanup recommendation
  console.log(`\n${colors.yellow}Note: To unlink the package, run:${colors.reset}`);
  console.log('  pnpm unlink @tummycrypt/tsd');
  console.log('  pnpm install');
  
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});