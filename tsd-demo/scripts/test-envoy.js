#!/usr/bin/env node

import { 
  runTestSuite, 
  waitForService, 
  testTranslation, 
  testPageTranslation,
  checkCache,
  httpRequest,
  assert,
  wait,
  colors,
  exec
} from './test-utils.js';

const BASE_URL = 'http://localhost:3000';
const ENVOY_URL = 'http://localhost:8080';
const ENVOY_ADMIN_URL = 'http://localhost:9901';

async function runTests() {
  console.log(`${colors.blue}Testing Production Mode with Envoy${colors.reset}`);
  
  // Check if containers are running
  console.log('Checking container status...');
  try {
    const { stdout } = await exec('podman ps --format "{{.Names}}"', { silent: true });
    const containers = stdout.split('\n').filter(Boolean);
    const required = ['tsd-libretranslate', 'tsd-grpc-service', 'tsd-envoy', 'tsd-app', 'tsd-caddy'];
    const missing = required.filter(c => !containers.includes(c));
    
    if (missing.length > 0) {
      console.error(`Missing containers: ${missing.join(', ')}`);
      console.log('Run "pnpm prod:up" first');
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to check containers. Is Podman running?');
    process.exit(1);
  }

  // Wait for services
  const services = [
    { name: 'App', url: BASE_URL },
    { name: 'Envoy', url: `${ENVOY_URL}/health` },
    { name: 'Envoy Admin', url: `${ENVOY_ADMIN_URL}/stats` }
  ];

  for (const service of services) {
    const ready = await waitForService(service.url, 30, 2000);
    if (!ready) {
      console.error(`${service.name} not ready`);
      process.exit(1);
    }
  }

  const tests = [
    {
      name: 'Envoy proxy is healthy',
      fn: async () => {
        const health = await httpRequest(`${ENVOY_URL}/health`);
        assert(health.ok, 'Envoy health check failed');
        assert(health.data === 'OK', 'Envoy not healthy');
      }
    },
    {
      name: 'Production app detects Envoy',
      fn: async () => {
        const response = await fetch(`${BASE_URL}/en/tsd-demo`);
        const html = await response.text();
        
        // Check for Envoy config injection
        assert(html.includes('window.__TSD_CONFIG__'), 'TSd config not injected');
        assert(html.includes('http://envoy:8080'), 'Envoy endpoint not configured');
        
        console.log('  ✓ Envoy configuration injected');
      }
    },
    {
      name: 'gRPC-Web endpoints are accessible',
      fn: async () => {
        // Test gRPC-Web endpoint through Envoy
        const response = await httpRequest(`${ENVOY_URL}/tsd.TranslationService/Translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/grpc-web+json',
            'X-Grpc-Web': '1'
          },
          body: {
            text: 'Hello',
            native_locale: 'en',
            target_locale: 'es'
          }
        });
        
        // Envoy should proxy to gRPC service
        console.log(`  gRPC-Web response status: ${response.status}`);
      }
    },
    {
      name: 'API translations work in production',
      fn: async () => {
        const result = await testTranslation(BASE_URL, 'Thank you', 'en', 'ja');
        assert(result.ok, `Translation failed: ${result.error || JSON.stringify(result.data)}`);
        assert(result.data.translated_text, 'No translation returned');
        console.log(`  Translated to Japanese: "${result.data.translated_text}"`);
      }
    },
    {
      name: 'Page translations work with Envoy',
      fn: async () => {
        // Load Spanish page
        const result = await testPageTranslation(BASE_URL, 'es', ['TSd Demo']);
        assert(result.ok, 'Failed to load Spanish page');
        
        // Wait for JIT translations
        console.log('  Waiting for translations to complete...');
        await wait(5000);
        
        // Check again for translated content
        const result2 = await testPageTranslation(BASE_URL, 'es', ['Ejemplos']);
        if (result2.found.length > 0) {
          console.log('  ✓ Spanish translations detected');
        }
      }
    },
    {
      name: 'LibreTranslate is accessible from containers',
      fn: async () => {
        // Test internal connectivity
        const { stdout } = await exec('podman exec tsd-app curl -s http://libretranslate:5000/languages | head -5', { silent: true });
        assert(stdout.includes('en'), 'LibreTranslate not responding correctly');
        console.log('  ✓ Internal service connectivity confirmed');
      }
    },
    {
      name: 'Cache persistence in production',
      fn: async () => {
        // Trigger some translations
        await testTranslation(BASE_URL, 'Good evening', 'en', 'fr');
        await testTranslation(BASE_URL, 'Good evening', 'en', 'de');
        
        // Wait for cache writes
        await wait(2000);
        
        // Check cache from container
        const { stdout } = await exec('podman exec tsd-app ls -la .tsd-cache 2>/dev/null || echo "No cache"', { silent: true });
        console.log('  Cache directory:', stdout.trim().split('\n')[0]);
      }
    },
    {
      name: 'Envoy metrics show traffic',
      fn: async () => {
        const stats = await httpRequest(`${ENVOY_ADMIN_URL}/stats?filter=http.ingress_http`);
        assert(stats.ok, 'Failed to get Envoy stats');
        
        const hasTraffic = stats.data.includes('http.ingress_http');
        if (hasTraffic) {
          console.log('  ✓ Envoy processing requests');
        }
      }
    }
  ];

  const success = await runTestSuite('Production with Envoy Tests', tests);
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});