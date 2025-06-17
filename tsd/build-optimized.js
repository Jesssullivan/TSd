import { build } from 'esbuild';
import { readdir, copyFile, mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { gzipSync } from 'zlib';

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
      !item.name.endsWith('.test.ts') &&
      !item.name.endsWith('.d.ts')
    ) {
      files.push(path);
    }
  }

  return files;
}

// Clean previous build
if (existsSync('dist')) {
  await rm('dist', { recursive: true });
}
await mkdir('dist', { recursive: true });

// Build TypeScript files with optimization
const tsFiles = await getFiles('src', '.ts');

console.log('Building TypeScript files with optimizations...');

// Separate builds for different entry points to enable tree-shaking
const entryPoints = {
  index: 'src/index.ts',
  'vite/index': 'src/vite/index.ts',
  'svelte/index': 'src/svelte/index.ts',
  'svelte/locale-store': 'src/svelte/locale-store.ts'
};

// Build each entry point
for (const [outfile, entry] of Object.entries(entryPoints)) {
  await build({
    entryPoints: [entry],
    outfile: `dist/${outfile}.js`,
    format: 'esm',
    platform: 'node',
    target: 'es2020',
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: false, // Remove sourcemaps for production
    keepNames: false,
    // Mark peer dependencies and Svelte files as external
    external: [
      '*.svelte',
      './svelte/*.svelte',
      '../svelte/*.svelte',
      'svelte',
      'svelte/*',
      '@sveltejs/kit',
      '@sveltejs/kit/*',
      'vite',
      'vite/*',
      '@grpc/grpc-js',
      '@grpc/proto-loader',
      'express',
      'cors',
      'fs',
      'path',
      'url',
      'child_process',
      'crypto',
      'http',
      'https',
      'net',
      'os',
      'stream',
      'util',
      'zlib'
    ],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    plugins: [{
      name: 'svelte-external',
      setup(build) {
        build.onResolve({ filter: /\.svelte$/ }, args => ({
          path: args.path.replace('../', './'),
          external: true
        }));
      }
    }]
  });
}

// Build individual library files (non-bundled for better tree-shaking)
const libFiles = await getFiles('src/lib', '.ts');
const clientFiles = await getFiles('src/client', '.ts');
const viteFiles = (await getFiles('src/vite', '.ts')).filter(f => !f.endsWith('/index.ts'));

await build({
  entryPoints: [...libFiles, ...clientFiles, ...viteFiles],
  outdir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'es2020',
  bundle: false,
  minify: true,
  treeShaking: true,
  sourcemap: false,
  keepNames: false,
  outExtension: { '.js': '.js' }
});

// Copy and optimize Svelte files
console.log('Copying and optimizing Svelte files...');
const svelteFiles = await getFiles('src', '.svelte');
for (const file of svelteFiles) {
  const relativePath = relative('src', file);
  const destPath = join('dist', relativePath);
  const destDir = dirname(destPath);

  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true });
  }

  // Copy Svelte file without minification (Svelte compiler handles this)
  await copyFile(file, destPath);
}

// Copy proto files (these are small, no optimization needed)
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

// Generate optimized TypeScript declarations using tsc
console.log('Generating TypeScript declarations...');
try {
  execSync('tsc --declaration --emitDeclarationOnly --outDir dist', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Could not generate TypeScript declarations');
  
  // Fallback: Create minimal declaration files
  const declarationFiles = [
    { path: 'dist/index.d.ts', content: 'export * from "./types";\nexport * from "./lib/translation-monad";\nexport * from "./lib/libretranslate-client";\nexport * from "./lib/envoy-discovery";' },
    { path: 'dist/vite/index.d.ts', content: 'export { tsdVitePlugin } from "./index";\nexport type { TsdVitePluginOptions } from "../types";' },
    { path: 'dist/svelte/index.d.ts', content: 'export { default as Tsd } from "./Tsd.svelte";\nexport * from "./locale-store";' }
  ];

  for (const { path, content } of declarationFiles) {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(path, content);
  }
}

// Create optimized package.json
console.log('Creating optimized package.json...');
const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));

// Update paths and remove unnecessary fields
const optimizedPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  type: packageJson.type,
  description: packageJson.description,
  keywords: packageJson.keywords,
  license: packageJson.license,
  repository: packageJson.repository,
  main: './index.js',
  module: './index.js',
  types: './index.d.ts',
  exports: {
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
  },
  sideEffects: false, // Enable tree-shaking
  peerDependencies: packageJson.peerDependencies,
  dependencies: {
    // Only include runtime dependencies
    '@grpc/grpc-js': packageJson.dependencies['@grpc/grpc-js'],
    '@grpc/proto-loader': packageJson.dependencies['@grpc/proto-loader']
  },
  // Mark express and cors as optional since they're only needed for gRPC server
  optionalDependencies: {
    'express': packageJson.dependencies.express,
    'cors': packageJson.dependencies.cors
  }
};

await writeFile('dist/package.json', JSON.stringify(optimizedPackageJson, null, 2));

// Copy README with size badge
if (existsSync('README.md')) {
  let readme = await readFile('README.md', 'utf-8');
  
  // Calculate package size
  const files = await getFiles('dist');
  let totalSize = 0;
  let gzipSize = 0;
  
  for (const file of files) {
    const content = await readFile(file);
    totalSize += content.length;
    gzipSize += gzipSync(content).length;
  }
  
  const sizeKB = (totalSize / 1024).toFixed(1);
  const gzipKB = (gzipSize / 1024).toFixed(1);
  
  // Add size badge to README if not present
  if (!readme.includes('![npm bundle size]')) {
    const sizeBadge = `\n![npm bundle size](https://img.shields.io/bundlephobia/min/@tummycrypt/tsd)\n![npm bundle size (gzip)](https://img.shields.io/bundlephobia/minzip/@tummycrypt/tsd)\n`;
    readme = readme.replace(/^#/, sizeBadge + '#');
  }
  
  await writeFile('dist/README.md', readme);
  
  console.log(`\n📊 Package Size Analysis:`);
  console.log(`   Uncompressed: ${sizeKB} KB`);
  console.log(`   Gzipped: ${gzipKB} KB`);
}

// Remove any accidental test files or unnecessary files
const unnecessaryPatterns = [
  '**/*.test.js',
  '**/*.spec.js',
  '**/*.map',
  '**/tsconfig.json',
  '**/.DS_Store'
];

for (const pattern of unnecessaryPatterns) {
  try {
    execSync(`find dist -name "${pattern}" -delete`, { stdio: 'ignore' });
  } catch {}
}

console.log('\n✅ Optimized build completed successfully!');

// Show size comparison
console.log('\n📦 Size Comparison:');
try {
  const oldSize = execSync('du -sh dist/', { encoding: 'utf-8' }).trim().split('\t')[0];
  console.log(`   Previous build: ~208K`);
  console.log(`   Optimized build: ${oldSize}`);
} catch {}