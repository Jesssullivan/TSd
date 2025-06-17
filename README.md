# TSd

*High performance localization system for SvelteKit*

[![npm version](https://img.shields.io/npm/v/@tummycrypt/tsd.svg)](https://www.npmjs.com/package/@tummycrypt/tsd)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@tummycrypt/tsd)](https://bundlephobia.com/package/@tummycrypt/tsd)
[![npm bundle size (gzip)](https://img.shields.io/bundlephobia/minzip/@tummycrypt/tsd)](https://bundlephobia.com/package/@tummycrypt/tsd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> 📚 **[View llms.txt](./llms.txt)** for comprehensive project documentation following the [llmstxt.org](https://llmstxt.org/) standard.

## Installation

```bash
# pnpm
pnpm add @tummycrypt/tsd

## or: ##

# npm
npm install @tummycrypt/tsd

# yarn
yarn add @tummycrypt/tsd
```


## TSd - Next-Generation Translation System for SvelteKit

TSd (Translation System Daemon) is a modern, high-performance translation plugin for SvelteKit that provides just-in-time translation with automatic caching, gRPC support, and Kubernetes-ready architecture.

## 🚀 Features

- **Just-in-Time Translation**: Translations are fetched only when needed
- **Monad-Based Architecture**: Functional, composable translation pipeline
- **Dual Protocol Support**: HTTP/JSON for development, gRPC-Web for production
- **Envoy Auto-Discovery**: Automatically detects and uses Envoy proxy in Kubernetes
- **Real-time Updates**: Live translation updates via Server-Sent Events
- **HMR Support**: Hot Module Replacement for instant development feedback
- **TypeScript First**: Full type safety with strict linting
- **Tree-Shakeable**: Only bundle the translations you use
- **LibreTranslate Integration**: Built-in support for open-source translation API

## 📐 Architecture

```
┌────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Svelte Component  │     │   Vite Plugin    │     │ Translation API │
│   <Tsd>Hello</Tsd> │────▶│  (gRPC Server)   │────▶│ (LibreTranslate)│
└────────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                          │
         │                       │                          │
         ▼                       ▼                          │
┌─────────────────┐     ┌───────────────────┐               │
│  Locale Store   │     │ Translation Cache │◀──────────────┘
│ (Reactive State)│     │   (File System)   │
└─────────────────┘     └───────────────────┘
```

## 🚦 Quick Start

### 1. Configure Vite

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { tsdVitePlugin } from '@tummycrypt/tsd/vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    tsdVitePlugin({
      translationProvider: {
        type: 'libretranslate',
        apiKey: 'your-api-key',
      },
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
      envoy: {
        autoDiscover: true, // Auto-detect Envoy in production
      },
    }),
  ],
});
```

### 2. Set Up Routes

Create a `[locale]` directory structure for URL-based locale routing:

```
src/routes/
├── [locale]/
│   ├── +layout.server.ts
│   ├── +layout.svelte
│   └── your-page/
│       └── +page.svelte
└── +page.server.ts  # Redirects to user's preferred locale
```

### 3. Use in Components

```svelte
<script lang="ts">
  import { Tsd, setLocale, localeStore } from '@tummycrypt/tsd/svelte';
</script>

<h1><Tsd>Welcome to our site!</Tsd></h1>
<p><Tsd>This text will be automatically translated.</Tsd></p>

<button on:click={() => setLocale('es')}>Español</button>
```

## ⚙️ Configuration Options

### Vite Plugin Options

```typescript
interface TsdConfig {
  defaultLocale?: string; // Default: 'en'
  supportedLocales?: string[]; // Default: ['en', 'es', 'fr', 'de', 'ja', 'zh']
  translationProvider: {
    type: 'libretranslate' | 'google' | 'custom';
    apiKey?: string;
    endpoint?: string; // Custom API endpoint
    customTranslate?: (text: string, from: string, to: string) => Promise<string>;
  };
  cacheDir?: string; // Default: '.tsd-cache'
  enableHMR?: boolean; // Default: true
  envoy?: {
    autoDiscover?: boolean; // Auto-detect Envoy proxy
    endpoint?: string; // Manual Envoy endpoint
    kubernetesNamespace?: string; // K8s namespace
    serviceName?: string; // K8s service name
  };
}
```

### Component API

```typescript
// Import components and utilities
import { Tsd, setLocale, getLocale, localeStore } from '@tummycrypt/tsd/svelte';

// Get current locale
const currentLocale = getLocale(); // 'en'

// Set locale
setLocale('es');

// Subscribe to locale changes
localeStore.subscribe((locale) => {
  console.log('Locale changed to:', locale);
});
```

## 🔌 Protocol Support

### Development Mode (HTTP/JSON)

- Simple REST endpoints
- Easy debugging with browser DevTools
- Server-Sent Events for real-time updates

### Production Mode (gRPC-Web with Envoy)

- Binary protocol for efficiency
- Automatic Envoy sidecar detection
- Kubernetes service mesh integration

### Console Logging

TSd provides detailed console logging with emojis for easy debugging:

```
[TSd] 🚀 Using Envoy proxy at http://localhost:15000 (kubernetes environment)
[TSd] 📤 Request #1: Translating "Hello" from en to es
[TSd] ✅ Request #1 completed in 23.45ms via Envoy
[TSd] 📥 Translation: "Hello" → "Hola"
```

## 🏗 Advanced Usage

### Custom Translation Provider

```typescript
tsdVitePlugin({
  translationProvider: {
    type: 'custom',
    customTranslate: async (text, from, to) => {
      // Your custom translation logic
      const response = await fetch('your-api', {
        method: 'POST',
        body: JSON.stringify({ text, from, to }),
      });
      return response.json();
    },
  },
});
```

### Kubernetes Deployment

TSd automatically detects Kubernetes environments and Envoy sidecars. For manual configuration:

```typescript
tsdVitePlugin({
  envoy: {
    autoDiscover: false,
    endpoint: process.env.ENVOY_ENDPOINT || 'http://localhost:15000',
    kubernetesNamespace: 'production',
    serviceName: 'translation-service',
  },
});
```

See `k8s/example-deployment.yaml` for a complete Kubernetes example.



### Code Quality

This project enforces strict code quality standards:

- **ESLint**: Strict TypeScript rules with no-any policy
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for linting
- **TypeScript**: Strict mode with full type checking

## 🔄 Migration from Traditional i18n

TSd offers a different approach than traditional i18n libraries:

| Traditional i18n              | TSd                               |
|-------------------------------|-----------------------------------|
| Pre-load all translations     | Load on-demand                    |
| Key-based (`t('home.title')`) | Content-based (`<Tsd>Home</Tsd>`) |
| Manual string extraction      | Automatic detection               |
| Static bundles                | Dynamic loading                   |
| File-based                    | API-based with caching            |

## 🎯 Performance & Optimization

### Bundle Size

TSd is optimized for minimal bundle impact:

- **~196KB** total package size (down from 208KB)
- **~20KB** gzipped when bundled
- **Tree-shakeable** - only import what you use
- **Code-splitting** friendly with dynamic imports

### Optimization Techniques

1. **Minified JavaScript** - All JS files are pre-minified with esbuild
2. **No source maps** in production builds
3. **Peer dependencies** - SvelteKit, Svelte, and Vite are not bundled
4. **Optional dependencies** - Express/CORS only needed for gRPC server
5. **Modular exports** - Import only the parts you need:
   ```js
   // Import only Svelte components
   import { Tsd } from '@tummycrypt/tsd/svelte';
   
   // Import only Vite plugin
   import { tsdVitePlugin } from '@tummycrypt/tsd/vite';
   ```

### Runtime Performance

- **Caching**: All translations are cached locally and in-memory
- **Deduplication**: Identical strings are translated only once
- **Streaming**: Real-time updates via SSE or gRPC streaming
- **Lazy loading**: Translations load on-demand as users navigate

## 📦 Demo & Testing

The `tsd-demo/` directory contains a comprehensive demonstration and testing suite:

```bash
cd tsd-demo
pnpm install
Hm # Run all tests (dev, preview, production)
```

See the [demo README](./tsd-demo/README.md) for detailed testing instructions.

## 🤝 Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📦 Deployment

This package is automatically published to NPM using GitHub Actions when a new release is created.

### Manual Deployment

To manually deploy a new version:

1. Update the version in `tsd/package.json`
2. Build the package: `cd tsd && pnpm build`
3. Publish to NPM: `cd tsd && npm publish`

### GitHub Actions Deployment

To deploy using GitHub Actions:

1. Go to the Actions tab in the GitHub repository
2. Select the "Publish to NPM" workflow
3. Click "Run workflow"
4. Enter the version type (patch, minor, major) or a specific version
5. Click "Run workflow"

Note: You need to have an NPM token stored as a secret named `NPM_TOKEN` in your GitHub repository.

## 📄 License
MIT © Jess Sullivan
