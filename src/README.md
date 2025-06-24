# TSd - Next Generation Translation Package for SvelteKit

TSd (Translation Service Daemon) is a internationalization solution that extends the ParaglideJS design concept by leveraging functional mapping and monadic composition for optimal tree-shaking and transparent developer experience. Unlike traditional i18n solutions (and paraglide ^w^) that require explicit key management and compile-time transformations, TSd provides a truly transparent translation layer that works seamlessly with SSR, MDsveX, and static site generation paradigms.  We can achieve this with a live Vite plugin that (via http and/or gRPC protocols) can dynamically translate wrapped hardcoded text during runtime.  Furthermore, TSd has pretty slick caching and JIT optimizations, allowing for the composable translations to remain preformat even when scaled to the moon. :)  With this in mind, TSd works with Envoy and k8s friendly environment natively. 


## Project Overview

TSd is part of the Zentaisei/Tinyland ecosystem - a zero-trust, distributed, autonomous system designed for self-healing, self-scaling infrastructure. Within this ecosystem, TSd exemplifies our core principles:

- **Monadic Architecture**: All translation operations are wrapped in composable monads (`TranslationMonad<T>`) with `map`, `flatMap`, and `getOrElse` operations, ensuring type safety and error resilience
- **Functional Mapping**: JIT translation expansion using SHA-256 content-addressed caching, enabling perfect tree-shaking while maintaining runtime flexibility
- **Zero Configuration**: Simply wrap text in `<Tsd>` components - no keys, no build steps, no configuration files
- **Multi-Protocol Support**: HTTP/JSON, gRPC-Web, and Kubernetes-native networking with automatic protocol selection
- **Security, coverage, PBT, TDD, monorepo project structure**:  I know, it is a lot and Nx is kinda crazy but ... talk about reaping the benefits of actual organized, regimented code!

## Why TSd Solves i18n

Traditional i18n approaches fail developers by:
- Requiring manual key management and synchronization
- Breaking intellisense and type safety
- Complicating the build process with compile-time transformations
- Creating friction between development and translation workflows

TSd eliminates these pain points through:
- **Transparent Operation**: Text wrapped in `<Tsd>` components is automatically translated based on URL locale
- **Content-Based Addressing**: SHA-256 hashes of normalized text serve as keys, eliminating manual key management
- **Background Expansion**: Translations are dynamically, JIT generated for supported locales in the background
- **Perfect Tree-Shaking**: Only used translations are included in production builds through functional mapping
- **SSR/SSG Compatible**: should work seamlessly with all SvelteKit rendering modes

## Security & Quality Standards

As part of the Zentaisei Tinyland monorepo project, TSd adheres to some pretty stringent security and quality standards:

### Security Measures
- **Zero Trust**: Every component assumes breach and verifies continuously.  Tinyland is an autonomous, distributed system.  Most of this code is still under my pillow and is constantly evolving. I literally had an actual need for TSd outside of my pet project, so consider this the first baby artifact to make a peek into the real world, outside of tinyland heheheehe
- **Dependency Forking**: All critical dependencies are forked and built specifically for tinyland. 
- **Cryptographic Signing**: Package integrity verified through signatures
- **Container Isolation**: Multi-layer container security with rootless execution (runtime is talos, hypervisors are "tinymachines"; the sum of a my chapel language hypervisor + my QEMU fork called qemUwU, which adds apple silicon metal support and additional options for preempting with rocky 10)
- **Supply Chain Protection**: Local Verdaccio registry with recursive verification

### Testing Excellence
- **~85%+ Code Coverage**: Comprehensive unit and integration tests
- **Property-Based Testing (PBT)**: Automated edge case discovery using fast-check ^w^
- **End-to-End Testing**: Fully automated, multi-browser, multi-protocol validation ;)
- **Container Testing**: Full lifecycle testing across all deployment modes
- **Adoption Story Testing**: Automated testing of user adoption flows (this was more of a lark)
- **Performance Benchmarks**: Sub-100ms p95 latency requirements

Real-time translation service with LibreTranslate integration, automatic caching, and multi-protocol support.

## Quick Start

### 1. Install

```bash
npm install @tummycrypt/tsd
```

### 2. Configure Vite

Create `vite.config.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { tsdVitePlugin } from '@tummycrypt/tsd/vite';

// Configuration
const DEFAULT_API_KEY = '';
const apiKey = process.env.VITE_LIBRETRANSLATE_API_KEY || DEFAULT_API_KEY;

export default defineConfig({
  plugins: [
    sveltekit(),
    tsdVitePlugin({
      translationProvider: {
        type: 'libretranslate',
        apiKey,
        endpoint: process.env.VITE_LIBRETRANSLATE_URL || process.env.LIBRETRANSLATE_URL ? 
          `${process.env.VITE_LIBRETRANSLATE_URL || process.env.LIBRETRANSLATE_URL}/translate` :
          'http://localhost:5000/translate',
      },
      defaultLocale: 'en', 
      
      // we support all libre translate locales
      supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
      envoy: {
        autoDiscover: true,
        endpoint: process.env.VITE_ENVOY_ENDPOINT || process.env.ENVOY_ENDPOINT,
        kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
        serviceName: process.env.K8S_SERVICE_NAME || 'tsd-service'
      }
    })
  ]
});
```

### 3. Set Up App Structure

#### Create `src/app.html`:
```html
<!doctype html>

<!-- update lang tag like this; backwards compatible with paraglide js style lang tag -->
<html lang="%tsd.lang%">

  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

Note: `%tsd.lang%` is replaced with the current locale by the hooks.server.ts.

#### Create `src/hooks.server.ts`:
```typescript
import type {Handle} from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === '/') {
    return new Response(null, {
      status: 302,
      headers: { location: '/en/tsd-demo' }
    });
  }

  const localeOnlyMatch = event.url.pathname.match(/^\/([a-z]{2})\/?$/);
  if (localeOnlyMatch) {
    const locale = localeOnlyMatch[1];
    return new Response(null, {
      status: 302,
      headers: { location: `/${locale}/tsd-demo` }
    });
  }

  return resolve(event, {
    transformPageChunk: ({html}) => {
      // Replace %tsd.lang% with the current locale
      const locale = event.params.locale || 'en';
      let modifiedHtml = html.replace(/%tsd\.lang%/g, locale);
      
      // In production, inject Envoy configuration
      if (process.env.NODE_ENV === 'production' && process.env.VITE_ENVOY_ENDPOINT) {
        const configScript = `<script>window.__TSD_CONFIG__ = { envoy: { endpoint: "${process.env.VITE_ENVOY_ENDPOINT}" } };</script>`;
        modifiedHtml = modifiedHtml.replace('</head>', `${configScript}</head>`);
      }
      
      return modifiedHtml;
    }
  });
};
```

### 4. Create Route Structure

```
src/routes/
├── +layout.svelte
├── +page.svelte
└── [locale]/
    ├── +layout.server.ts
    ├── +layout.svelte
    └── tsd-demo/
        └── +page.svelte
```

#### Create `src/routes/+layout.svelte`:
```svelte
<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50">
  {@render children()}
</div>
```

#### Create `src/routes/+page.svelte`:
```svelte
<!-- This page will redirect to user's preferred language -->
<p>Redirecting...</p>
```

#### Create `src/routes/[locale]/+layout.server.ts`:
```typescript
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

const supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

export const load: LayoutServerLoad = async ({ params }) => {
  const { locale } = params;
  
  // Validate locale
  if (!supportedLocales.includes(locale)) {
    // Return a 404 error for unsupported locales instead of redirect
    throw error(404, 'Locale not supported');
  }
  
  return {
    locale
  };
};
```

#### Create `src/routes/[locale]/+layout.svelte`:
```svelte
<script lang="ts">
  import { setLocale } from '@tummycrypt/tsd/svelte';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  // Use Svelte 5 $props() as required by SPEC
  const { data, children }: { data: { locale: string }, children: Snippet } = $props();

  // Use Svelte 5 $effect for reactivity
  $effect(() => {
    if (data.locale) {
      setLocale(data.locale);
    }
  });

  // Also react to page changes
  $effect(() => {
    if ($page.params.locale) {
      setLocale($page.params.locale);
    }
  });
</script>

{@render children()}
```

#### Create `src/routes/[locale]/tsd-demo/+page.svelte`:
```svelte
<script lang="ts">
  import { Tsd, setLocale, localeStore } from '@tummycrypt/tsd/svelte';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Locale } from '@tummycrypt/tsd';

  const { data } = $props<{ data: { locale: string } }>();

  let currentLocale = $state(data.locale as Locale);
  let isNavigating = $state(false);
  
  // Supported languages for the demo
  const languages: Array<{ code: Locale; name: string; rtl?: boolean }> = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية', rtl: true },
  ];

  // Track cleanup functions
  let cleanupFunctions: (() => void)[] = [];

  onMount(() => {
    try {
      // Subscribe to locale store
      const unsubscribe = localeStore.subscribe((locale) => {
        currentLocale = locale;
      });
      cleanupFunctions.push(unsubscribe);
    } catch (error) {
      console.error('[TSD Demo] Error in onMount:', error);
    }
  });

  onDestroy(() => {
    try {
      // Clean up all tracked functions
      cleanupFunctions.forEach(cleanup => cleanup());
      cleanupFunctions = [];
    } catch (error) {
      console.warn('[TSD Demo] Error in onDestroy:', error);
    }
  });

  // Switch locale and navigate
  const switchLocale = async (locale: Locale) => {
    if (locale === currentLocale || isNavigating) return;
    
    try {
      isNavigating = true;
      setLocale(locale);
      
      // Navigate to the new locale URL
      const currentPath = window.location.pathname.split('/').slice(2).join('/');
      await goto(`/${locale}/${currentPath || 'tsd-demo'}`);
    } catch (error) {
      console.error('[TSD Demo] Error switching locale:', error);
    } finally {
      isNavigating = false;
    }
  };
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Header -->
  <header class="mb-8">
    <h1 class="text-4xl font-bold">
      <Tsd>TSd Translation Demo</Tsd>
    </h1>
  </header>

  <!-- Language Selector Navigation -->
  <nav class="mb-8">
    <div class="flex flex-wrap gap-2">
      {#each languages.slice(0, 6) as lang}
        <button
          onclick={() => switchLocale(lang.code)}
          class="px-4 py-2 rounded-lg font-medium transition-all duration-200
            {currentLocale === lang.code 
              ? 'bg-primary-500 text-white shadow-md' 
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'}"
          disabled={isNavigating}
          data-locale={lang.code}
        >
          {lang.name}
        </button>
      {/each}
    </div>
  </nav>

  <!-- Main Translation Interface -->
  <main class="grid lg:grid-cols-2 gap-8">
    <!-- Translation Input Section -->
    <section class="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">
        <Tsd>Translation Input</Tsd>
      </h2>
      
      <div class="space-y-4">
        <!-- Source Language Display -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-600 dark:text-surface-400">
            <Tsd>From:</Tsd>
          </span>
          <span class="font-medium">{languages.find(l => l.code === currentLocale)?.name || currentLocale}</span>
        </div>
        
        <p>
          <Tsd>This text will be automatically translated based on the current locale.</Tsd>
        </p>
      </div>
    </section>
  </main>
</div>
```

## Development

### Start LibreTranslate

```bash
# Using Podman Compose
podman-compose -f podman-compose-simple.yml up -d

# Or using Docker Compose
docker compose -f docker-compose.simple.yml up -d

# Start your app
npm run dev
```

### Available Container Stacks

```bash
# Simple (LibreTranslate only)
podman-compose -f podman-compose-simple.yml up

# gRPC mode (with Envoy proxy demo)
podman-compose -f podman-compose-grpc.yml up

# Full stack (all services demo)
podman-compose -f podman-compose-full.yml up

# Production (with Caddy + SSL demo)
podman-compose -f podman-compose-production.yml up
```

## Key Implementation Details


### Import Paths
In development: `@tinyland/tsd/svelte`  
When published: `@tummycrypt/tsd/svelte`

## Translation Cache

TSd automatically caches translations:

- **Location**: `.tsd-cache/` directory in your project root
- **Key Format**: SHA-256 hash of normalized text + locale
- **Persistence**: Survives development restarts
- **Background Expansion**: Automatically translates to all supported locales

## Testing with Nx

```bash
# Unit tests
nx test tsd

# E2E tests
nx test:e2e tsd

# Property-based tests
nx eval:pbt tsd

# Full evaluation suite
nx eval:full tsd

# Container tests
nx eval:container tsd

# CI-optimized tests
nx eval:ci tsd
```

## Environment Variables

```bash
# LibreTranslate settings
VITE_LIBRETRANSLATE_API_KEY=your-api-key
VITE_LIBRETRANSLATE_URL=http://localhost:5000

# Envoy proxy (for gRPC mode)
VITE_ENVOY_ENDPOINT=http://localhost:8080

# Kubernetes settings
K8S_NAMESPACE=default
K8S_SERVICE_NAME=tsd-service
```

## Nx Commands Reference

```

### Testing
```bash
nx test tsd               # Run unit tests
nx test:e2e tsd          # Run E2E tests
nx test:http tsd         # Test HTTP protocol
nx test:grpc tsd         # Test gRPC protocol
nx test:coverage tsd     # Run tests with coverage
```

### Tinyland monorepo evaluation suites for TSd
```bash
nx eval:full tsd         # Full evaluation suite
nx eval:quick tsd        # Quick evaluation
nx eval:pbt tsd          # Property-based testing
nx eval:container tsd    # Container testing
nx eval:adoption tsd     # User adoption testing
nx eval:ci tsd           # CI-optimized tests
```

### Utilities
```bash
nx compile-proto tsd     # Compile protobuf files
nx start:grpc tsd        # Start gRPC server
nx doctor tsd            # Check system requirements
nx check-podman tsd      # Verify Podman setup
nx lint tsd              # Lint the code
```

## Features

- **Automatic Translation**: Wrap text in `<Tsd>` component
- **URL-based Locales**: Routes like `/en/`, `/es/`, `/fr/`
- **Svelte 5 Runes**: Uses `$props`, `$state`, `$effect`, `$derived`
- **Persistent Cache**: Reduces API calls
- **Multi-Protocol**: HTTP, gRPC-Web, kubernetes native networking support
- **Real-time Updates**: Live translation updates w/ SSE
- **Container Ready**: Podman/Docker compose configurations
- **Production Ready**: SSL, monitoring, health checks
- **85% + coverage and extensive full lifecycle (and adoption story!) testing**: not a just a stub or an idea

## Contributing to TSd - not quite ready yet

*This is mostly a tinyland intranet project.  gonna need to adapt stuff or spin out TSd completely to make PRs a reasonable ask for git nomads ready to fix my shitty package*
