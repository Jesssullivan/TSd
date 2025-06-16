import { build } from 'esbuild';
import { readdir, copyFile, mkdir } from 'fs/promises';
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

const tsFiles = await getFiles('src', '.ts');

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

console.log(`Built ${tsFiles.length} TypeScript files and copied ${svelteFiles.length} Svelte files`);
