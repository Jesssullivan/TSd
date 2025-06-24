# TSd Architecture Documentation

## Overview

TSd (Translation Service Daemon) has been refactored to use a clean, functional architecture centered around monads for handling translation operations. The system now provides a unified approach using gRPC for communication and functional programming patterns for reliability.

## Core Components

### 1. Translation Monad (`lib/translation-monad.ts`)

The translation monad provides a functional wrapper for translation operations:

- **Synchronous Monad**: `createTranslationMonad<T>(value?: T)`
  - Handles immediate values and transformations
  - Provides error handling through empty monad pattern
  
- **Asynchronous Monad**: `createAsyncTranslationMonad<T>(promise: Promise<T>)`
  - Wraps async operations in a monad interface
  - Handles promise rejections gracefully

- **Utility Functions**:
  - `chainTranslations()`: Combines multiple translation monads
  - `failedTranslation()`: Creates a failed monad with error logging

### 2. Translation Manager (`vite/translation-manager.ts`)

Manages translation operations using monads throughout:

- **Key Methods**:
  - `getOrCreateTranslation()`: Returns `TranslationMonad<string>`
  - `addTranslationRequest()`: Returns `TranslationMonad<string>` with translation key
  - `getTranslation()`: Returns `TranslationMonad<string>` for cached translations

- **Features**:
  - Automatic caching with file persistence
  - Background translation for all supported locales
  - SHA-256 based key generation for consistent lookups

### 3. gRPC Integration (`vite/grpc-web-server.ts`)

Provides real-time translation services:

- HTTP/JSON fallback for development
- Envoy proxy detection for Kubernetes environments
- Server-Sent Events for real-time updates
- Automatic protocol negotiation

### 4. Svelte Component (`svelte/Tsd.svelte`)

Unified component for translation display:

- Automatic locale detection from URL
- gRPC client integration
- Real-time translation updates
- Loading states and error handling

### 5. Locale Store (`svelte/locale-store.ts`)

Simple, reactive locale management:

- URL-based locale detection
- Browser history integration
- Event-based updates
- SSR-compatible

## Data Flow

1. **Component Request**:
   ```
   Tsd.svelte -> gRPC Client -> Translation Manager -> LibreTranslate
   ```

2. **Monad Pipeline**:
   ```
   Text Input -> Translation Monad -> Map/FlatMap Operations -> Result/Fallback
   ```

3. **Cache Flow**:
   ```
   Request -> Check Cache -> Hit: Return Monad
                          -> Miss: Translate -> Cache -> Return Monad
   ```

## Testing Strategy

### E2E Test Coverage

1. **Translation Monad Tests** (`tests/e2e/translation-monad.spec.ts`):
   - Synchronous and asynchronous operations
   - Error handling and recovery
   - Monad composition and chaining

2. **Translation System Tests** (`tests/e2e/translation-system.spec.ts`):
   - Full translation pipeline with mocked services
   - Cache persistence and retrieval
   - Batch operations and performance
   - Error scenarios and fallbacks

3. **gRPC Integration Tests** (`tests/e2e/grpc-integration.spec.ts`):
   - Server setup and middleware
   - Client communication simulation
   - Real-time update handling
   - Envoy proxy scenarios

## Key Improvements

1. **Removed Duplicates**:
   - Eliminated all generated JS files
   - Consolidated duplicate Svelte components
   - Unified locale store implementations

2. **Functional Architecture**:
   - Monad-based error handling
   - Composable translation operations
   - Type-safe async handling

3. **Simplified Communication**:
   - Single gRPC-based approach
   - Removed Socket.IO dependencies
   - Automatic protocol detection

4. **Better Testing**:
   - Comprehensive E2E test suite
   - Monad operation testing
   - Performance benchmarks

## Usage Example

```typescript
// Using the translation monad
const translationMonad = manager.getOrCreateTranslation('Hello', 'en', 'es')
  .map(text => text.trim())
  .map(text => `¡${text}!`);

const result = await translationMonad.getOrElse('Translation failed');

// Chaining multiple translations
const batchResults = chainTranslations(
  manager.getTranslation(key1, 'fr'),
  manager.getTranslation(key2, 'de'),
  manager.getTranslation(key3, 'es')
);
```

## Configuration

```typescript
const config: TsdConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr', 'de'],
  translationProvider: {
    type: 'libretranslate',
    endpoint: 'http://localhost:5000'
  },
  cacheDir: '.tsd-cache',
  enableHMR: true,
  envoy: {
    autoDiscover: true
  }
};
```

## Future Enhancements

1. **Monad Extensions**:
   - Add `Either` monad for better error discrimination
   - Implement `Task` monad for lazy evaluation

2. **Performance**:
   - Implement translation request batching
   - Add memory-based LRU cache layer

3. **Observability**:
   - Add OpenTelemetry tracing
   - Implement translation metrics

4. **Provider Support**:
   - Add Google Translate provider
   - Implement custom provider interface