import { build } from 'esbuild';
import { readdir, copyFile, mkdir, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function getFiles(dir, ext = '.ts') {
  const files = [];
  const items = await readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await getFiles(path, ext)));
    } else if (
      item.name.endsWith(ext) &&
      !item.name.endsWith('.spec.ts') &&
      !item.name.endsWith('.test.ts')
    ) {
      files.push(path);
    }
  }

  return files;
}

const tsFiles = await getFiles('src', '.ts');
const jsFiles = await getFiles('src', '.js');

// Build TypeScript files
if (tsFiles.length > 0) {
  await build({
    entryPoints: tsFiles,
    outdir: 'dist',
    format: 'esm',
    platform: 'node',
    target: 'es2020',
    outExtension: { '.js': '.js' },
    bundle: false,
    sourcemap: true,
  });
}

// Copy JavaScript files
for (const file of jsFiles) {
  const relativePath = relative('src', file);
  const destPath = join('dist', relativePath);
  const destDir = dirname(destPath);
  
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true });
  }
  
  await copyFile(file, destPath);
}

// Copy Svelte files
const svelteFiles = await getFiles('src', '.svelte');
for (const file of svelteFiles) {
  const relativePath = relative('src', file);
  const destPath = join('dist', relativePath);
  const destDir = dirname(destPath);
  
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true });
  }
  
  await copyFile(file, destPath);
}

// Copy proto files
const protoFiles = await getFiles('src', '.proto');
for (const file of protoFiles) {
  const relativePath = relative('src', file);
  const destPath = join('dist', relativePath);
  const destDir = dirname(destPath);
  
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true });
  }
  
  await copyFile(file, destPath);
}

// Create basic declaration files for the main exports
const declarationFiles = [
  {
    path: 'dist/index.d.ts',
    content: `export * from './types.js';
export * from './lib/translation-monad.js';
export * from './lib/libretranslate-client.js';
export * from './lib/envoy-discovery.js';`
  },
  {
    path: 'dist/vite/index.d.ts', 
    content: `export { tsdVitePlugin } from './index.js';
export type { TsdConfig } from '../types.js';`
  },
  {
    path: 'dist/svelte/index.d.ts',
    content: `export { default as Tsd } from './Tsd.svelte';
export * from './locale-store.js';`
  }
];

for (const { path, content } of declarationFiles) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, content);
}

console.log(`Built ${tsFiles.length} TypeScript files, copied ${jsFiles.length} JavaScript files, ${svelteFiles.length} Svelte files, and ${protoFiles.length} proto files`);
