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

TSd is developed as part of the [Zentaisei monorepo](https://gitlab.com/tinyland/zentaisei) but accepts community contributions through this GitHub repository. Here's how the two-way sync works:

### 🔄 Two-Way Synchronization System

This repository is **automatically synchronized** with the main Zentaisei monorepo:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Zentaisei Repo    │────▶│   Nx Sync Agent     │────▶│   GitHub TSd Repo   │
│   (Source of Truth) │     │   (Automated Sync)  │     │   (Community PRs)   │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          ▲                                                        │
          │                  ┌─────────────────────┐              │
          └──────────────────│   Gerrit Review     │◀─────────────┘
                             │   (PR Integration)  │
                             └─────────────────────┘
```

### 📥 How to Contribute

#### 1. **Standard Community PRs** (Recommended)

For most contributions, use the standard GitHub workflow:

1. **Fork this repository**
2. **Create a feature branch**: `git checkout -b feature/my-awesome-feature`
3. **Make your changes** with comprehensive tests
4. **Ensure all tests pass**: `npm test`
5. **Submit a pull request** with detailed description

**What happens next:**
- Your PR is automatically detected by the Nx sync agent
- Changes are integrated into the Zentaisei monorepo via Gerrit
- After review and approval, changes flow back to this repo
- Your contribution is credited in both repositories

#### 2. **Direct Monorepo PRs** (For Core Contributors)

If you're working on core functionality:

1. **Clone the monorepo**: `git clone https://gitlab.com/tinyland/zentaisei.git`
2. **Work in the TSd package**: `cd packages/tsd`
3. **Follow monorepo guidelines**: See [contribution guide](https://gitlab.com/tinyland/zentaisei/-/blob/main/CONTRIBUTING.md)
4. **Submit merge request** to the monorepo

### 🏷️ PR Labels for Better Processing

Use these labels to help the sync agent process your PR:

- `upstream-proposal`: Mark for inclusion in the main monorepo
- `community-fix`: Bug fixes from the community
- `enhancement`: New features or improvements
- `documentation`: Documentation-only changes
- `breaking-change`: Changes that break backward compatibility

### 🧪 Testing Requirements

All contributions must include:

#### **Unit Tests**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # Generate coverage report
```

#### **Integration Tests**
```bash
npm run test:integration # Test with real translation APIs
npm run test:e2e        # End-to-end testing
```

#### **Demo Testing**
```bash
cd tsd-demo
npm run test:all        # Test all environments (dev, preview, production)
```

### 📋 Contribution Checklist

Before submitting your PR, ensure:

- [ ] **Tests pass**: All existing tests continue to pass
- [ ] **New tests added**: Your changes are covered by tests
- [ ] **Demo updated**: If applicable, update the demo application
- [ ] **Documentation updated**: README, code comments, and docs/ updated
- [ ] **TypeScript types**: Proper types for all new code
- [ ] **Performance impact**: No significant performance regressions
- [ ] **Security review**: No introduction of vulnerabilities
- [ ] **Breaking changes**: Clearly documented if any

### 🎯 Focus Areas for Contributions

We especially welcome contributions in:

1. **Translation Providers**: New provider integrations
2. **Framework Support**: Beyond SvelteKit (React, Vue, etc.)
3. **Performance Optimizations**: Bundle size, runtime performance
4. **Documentation**: Examples, tutorials, API docs
5. **Testing**: More comprehensive test coverage
6. **Accessibility**: A11y improvements
7. **Internationalization**: RTL support, complex scripts

### 🔒 Security Considerations

When contributing:

- **Never commit secrets**: API keys, tokens, or credentials
- **Validate inputs**: All user inputs must be properly validated
- **Review dependencies**: New dependencies require security review
- **Report vulnerabilities**: Use private disclosure for security issues

### 🐛 Bug Reports

For bug reports, please include:

1. **TSd version**: `npm list @tummycrypt/tsd`
2. **Environment**: Node.js version, OS, framework version
3. **Reproduction steps**: Minimal example to reproduce
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Error logs**: Full error messages and stack traces

### 💡 Feature Requests

For feature requests:

1. **Use case**: Describe the problem you're trying to solve
2. **Proposed solution**: How would you like it to work?
3. **Alternatives**: What alternatives have you considered?
4. **Implementation**: Are you willing to implement it?

### 🏆 Recognition

Contributors are recognized in:
- Both the GitHub repo and Zentaisei monorepo
- Release notes and changelogs
- Annual contributor reports
- Special mentions for significant contributions

### 📞 Getting Help

- **GitHub Issues**: For bugs, features, and general questions
- **Discussions**: For community Q&A and best practices
- **Monorepo Issues**: For core development questions

### 🚀 Development Setup

```bash
# Clone and setup
git clone https://github.com/jesssullivan/tsd.git
cd tsd
npm install

# Run tests
npm test

# Start demo
cd tsd-demo
npm run dev

# Build package
npm run build
```

Thank you for contributing to TSd! 🎉

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
