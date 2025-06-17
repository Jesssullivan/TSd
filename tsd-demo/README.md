# TSd Demo - Comprehensive Testing Suite

This demo showcases the TSd (Translation System for SvelteKit) with a complete production-ready infrastructure and comprehensive testing capabilities. It demonstrates distributed development without centralized CI/CD.

## Features

- **Real-time translations** using gRPC-Web streaming
- **Just-in-time (JIT) translation** with automatic caching
- **Multiple deployment modes**: Development, Preview, Production with Envoy
- **Comprehensive test suites** for all deployment modes
- **Local package development** with hot reload support
- **Production-grade infrastructure** with Podman containers

## Prerequisites

- Node.js 20+ and pnpm
- [Podman](https://podman.io/) and podman-compose
- Ports available: 3000, 4173, 5173, 8080, 9901

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests (development, preview, production)
pnpm test

# Or start specific mode:
pnpm dev          # Development mode
pnpm demo:preview # Preview production build
pnpm demo:prod    # Full production with Envoy
```

## Development Modes

### 1. Development Mode (`pnpm dev`)
- Hot module reload
- Direct API calls to external LibreTranslate
- Accessible at http://localhost:5173

### 2. Preview Mode (`pnpm preview`)
- Production build served locally
- Tests production optimizations
- Accessible at http://localhost:4173

### 3. Production Mode with Envoy (`pnpm prod:up`)
- Full containerized stack
- Envoy proxy for gRPC-Web
- Local LibreTranslate instance
- Accessible at http://localhost:3000

## Comprehensive Testing

### Run All Tests
```bash
pnpm test
```

This runs a complete test suite validating:
- ✅ Local package linking
- ✅ Development mode functionality
- ✅ Preview mode optimizations
- ✅ Production mode with Envoy

### Individual Test Suites

#### Test Local Package Development
```bash
pnpm test:link
```
Tests the ability to develop TSd package locally with hot reload.

#### Test Development Mode
```bash
pnpm dev       # In one terminal
pnpm test:dev  # In another terminal
```
Validates:
- API translation endpoints
- Page rendering in multiple locales
- JIT translation and caching
- Cache performance improvements

#### Test Preview Mode
```bash
pnpm preview        # In one terminal
pnpm test:preview   # In another terminal
```
Validates:
- Production build correctness
- API endpoints in production build
- Multi-locale support
- Cross-locale caching

#### Test Production with Envoy
```bash
pnpm prod:up       # Start production stack
pnpm test:envoy    # Run tests
pnpm prod:down     # Clean up
```
Validates:
- Envoy proxy configuration
- gRPC-Web endpoint accessibility
- Container interconnectivity
- Production mode detection
- Cache persistence

## Architecture

```
Development Mode:
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│  SvelteKit  │────▶│LibreTranslate│
│             │     │   (Vite)    │     │  (External)  │
└─────────────┘     └─────────────┘     └──────────────┘

Production Mode:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│    Caddy    │────▶│  SvelteKit  │────▶│    Envoy     │
│             │     │    (:80)    │     │   (:3000)   │     │  (gRPC-Web)  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────────────┘
                                                                      │
                                                            ┌──────────────┐
                                                            │ gRPC Service │
                                                            └──────────────┘
                                                                      │
                                                            ┌──────────────┐
                                                            │LibreTranslate│
                                                            │   (Local)    │
                                                            └──────────────┘
```

## Script Reference

### Development Scripts
```bash
pnpm dev              # Start dev server
pnpm dev:host         # Dev server accessible from network
pnpm dev:envoy        # Dev with Envoy endpoint configured
```

### Build Scripts
```bash
pnpm build            # Build for production
pnpm build:prod       # Build with NODE_ENV=production
pnpm build:clean      # Clean build artifacts
```

### Production Scripts
```bash
pnpm prod:build       # Build app and containers
pnpm prod:up          # Start production stack
pnpm prod:down        # Stop production stack
pnpm prod:logs        # View container logs
pnpm prod:status      # Check container status
```

### Testing Scripts
```bash
pnpm test             # Run all tests
pnpm test:dev         # Test development mode
pnpm test:preview     # Test preview mode
pnpm test:envoy       # Test production with Envoy
pnpm test:link        # Test local package linking
pnpm test:clean       # Clean test artifacts
```

### Utility Scripts
```bash
pnpm clean            # Clean all build and test artifacts
pnpm check            # TypeScript and Svelte checks
pnpm kill-port 5173   # Kill process on specific port
```

## Environment Configuration

### Development
```bash
VITE_LIBRETRANSLATE_URL=https://libretranslate.com  # External API
```

### Production
```bash
NODE_ENV=production
VITE_ENVOY_ENDPOINT=http://envoy:8080
VITE_LIBRETRANSLATE_URL=http://libretranslate:5000
```

### Kubernetes
```bash
K8S_NAMESPACE=default
K8S_SERVICE_NAME=tsd-service
```

## Translation Caching

TSd implements JIT (Just-In-Time) translation with intelligent caching:

1. **First Request**: Fetches translation from LibreTranslate
2. **Cached Requests**: Serves from `.tsd-cache/<locale>.json`
3. **Cache Structure**:
   ```json
   {
     "Hello": "Bonjour",
     "Welcome": "Bienvenue"
   }
   ```

The test suites validate:
- Cache files are created correctly
- Subsequent requests are faster
- Cache persists across page reloads
- Cache works in all deployment modes

## Local Package Development

For TSd package contributors:

```bash
# In tsd directory
pnpm build
pnpm link --global

# In tsd-demo directory
pnpm link --global @tummycrypt/tsd
pnpm dev  # Changes to TSd are reflected immediately
```

## Contributing

1. **Make changes** to either TSd package or demo
2. **Run tests** to ensure nothing breaks:
   ```bash
   pnpm test
   ```
3. **Check types** and code quality:
   ```bash
   pnpm check
   ```
4. **Test production** deployment:
   ```bash
   pnpm prod:build
   pnpm prod:up
   pnpm test:envoy
   ```

## Troubleshooting

### Container Issues
```bash
# Check status
pnpm prod:status

# View logs
pnpm prod:logs

# Restart everything
pnpm prod:restart
```

### Port Conflicts
```bash
# Kill specific port
pnpm kill-port 5173
pnpm kill-port 4173
pnpm kill-port 3000
```

### Test Failures
```bash
# Clean and retry
pnpm clean
pnpm test
```

### Cache Issues
```bash
# Clear translation cache
pnpm test:clean
```

## Supported Languages

- English (en)
- Spanish (es) 
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)

## License

MIT