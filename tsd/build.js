
import { build } from 'esbuild';
import { readdir, copyFile, mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';

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

// Build TypeScript files
const tsFiles = await getFiles('src', '.ts');

console.log('Building TypeScript files with esbuild...');
await build({
  entryPoints: tsFiles,
  outdir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'es2020',
  outExtension: { '.js': '.js' },
  bundle: false,
  sourcemap: true,
  minify: false,
  keepNames: true,
});

// Copy Svelte files
console.log('Copying Svelte files...');
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
console.log('Copying proto files...');
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

// Generate TypeScript declaration files manually for each entry point
console.log('Creating TypeScript declaration files...');
const entryPoints = [
  { src: 'src/index.ts', dist: 'dist/index.d.ts' },
  { src: 'src/vite/index.ts', dist: 'dist/vite/index.d.ts' },
  { src: 'src/svelte/index.ts', dist: 'dist/svelte/index.d.ts' }
];

for (const entry of entryPoints) {
  if (existsSync(entry.src)) {
    const destDir = dirname(entry.dist);
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true });
    }

    // Create a basic declaration file
    const content = `// Generated declarations for ${entry.src}
export * from '../${relative('dist', entry.src).replace('.ts', '')}';
`;
    await writeFile(entry.dist, content);
  }
}

// Copy package.json with updated paths for publishing
console.log('Copying package.json for publishing...');
const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));
// Update paths to be relative to dist
packageJson.main = './index.js';
packageJson.module = './index.js';
packageJson.types = './index.d.ts';
packageJson.exports = {
  '.': {
    types: './index.d.ts',
    import: './index.js'
  },
  './vite': {
    types: './vite/index.d.ts',
    import: './vite/index.js'
  },
  './svelte': {
    types: './svelte/index.d.ts',
    import: './svelte/index.js'
  }
};
// Remove development-only fields
delete packageJson.scripts;
delete packageJson.devDependencies;
delete packageJson['lint-staged'];

// Write the updated package.json to dist directory
await writeFile('dist/package.json', JSON.stringify(packageJson, null, 2), 'utf-8');

// Copy README and LICENSE
if (existsSync('README.md')) {
  await copyFile('README.md', 'dist/README.md');
}
if (existsSync('LICENSE')) {
  await copyFile('LICENSE', 'dist/LICENSE');
}

console.log(`✅ Build completed successfully!`);
console.log(`📦 Built ${tsFiles.length} TypeScript files, copied ${svelteFiles.length} Svelte files, and ${protoFiles.length} proto files`);