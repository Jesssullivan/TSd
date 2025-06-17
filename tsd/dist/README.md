# TSd

*High performance localization system for SvelteKit*

[![npm version](https://img.shields.io/npm/v/@tummycrypt/tsd.svg)](https://www.npmjs.com/package/@tummycrypt/tsd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
# npm
npm install @tummycrypt/tsd

# pnpm
pnpm add @tummycrypt/tsd

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

### To demo behavior with the provided sveltekit demo in `./tsd-demo`:

I suggest you try things out with a libretranslate API key.  This'll demonstrate the package using plebeian `http/json` calls.    `TSd` is built to be deployed in kubernetes where efficient cluster networking between a libretranslate container and the web server can be leveraged with gRPC.

1. Visit [LibreTranslate Portal](https://portal.libretranslate.com/)
2. Copy your API key from the dashboard

### 2. Configure Vite

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
                apiKey: 'your-api-key-here', // Replace with your API key
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

> **Note**: You can also store the API key in an environment variable for security, for example with hashi vault or `K8S_SECRETS`:
> ```typescript
> apiKey: process.env.LIBRETRANSLATE_API_KEY || 'your-api-key-here'
> ```

### 3. Set Up Routes

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

### 4. Use in Components

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

## 🔄 Migration from Traditional i18n

TSd offers a different approach than traditional i18n libraries:

| Traditional i18n              | TSd                               |
| ----------------------------- | --------------------------------- |
| Pre-load all translations     | Load on-demand                    |
| Key-based (`t('home.title')`) | Content-based (`<Tsd>Home</Tsd>`) |
| Manual string extraction      | Automatic detection               |
| Static bundles                | Dynamic loading                   |
| File-based                    | API-based with caching            |

## 📄 License
MIT © Jess Sullivan