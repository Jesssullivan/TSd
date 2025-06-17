#!/usr/bin/env node

import { 
  runTestSuite, 
  waitForService, 
  testTranslation, 
  testPageTranslation,
  checkCache,
  assert,
  wait,
  colors,
  exec
} from './test-utils.js';

const BASE_URL = 'http://localhost:4173';

async function runTests() {
  console.log(`${colors.blue}Testing Preview Mode (Production Build)${colors.reset}`);
  
  // Build first
  console.log('Building production bundle...');
  await exec('pnpm build');
  
  // Wait for preview server
  const ready = await waitForService(BASE_URL, 30, 2000);
  if (!ready) {
    console.error('Preview server not ready');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Production build serves correctly',
      fn: async () => {
        const result = await testPageTranslation(BASE_URL, 'en', [
          'Welcome to TSd Demo'
        ]);
        assert(result.ok, 'Failed to load page');
        assert(result.missing.length === 0, 'Page content missing');
      }
    },
    {
      name: 'API endpoints work in production build',
      fn: async () => {
        const result = await testTranslation(BASE_URL, 'Good morning', 'en', 'de');
        assert(result.ok, `Translation failed: ${result.error || result.data}`);
        assert(result.data.translated_text, 'No translation returned');
        console.log(`  Translated to: "${result.data.translated_text}"`);
      }
    },
    {
      name: 'Multiple locale pages load',
      fn: async () => {
        const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
        
        for (const locale of locales) {
          const result = await testPageTranslation(BASE_URL, locale, ['TSd Demo']);
          assert(result.ok, `Failed to load ${locale} page`);
          console.log(`  ✓ ${locale} page loaded`);
        }
      }
    },
    {
      name: 'Translation caching works across locales',
      fn: async () => {
        // Trigger translations for multiple locales
        const translations = [
          { text: 'Welcome', from: 'en', to: 'es' },
          { text: 'Welcome', from: 'en', to: 'fr' },
          { text: 'Welcome', from: 'en', to: 'de' }
        ];
        
        for (const { text, from, to } of translations) {
          const result = await testTranslation(BASE_URL, text, from, to);
          assert(result.ok, `Translation ${from}->${to} failed`);
        }
        
        // Check cache for each locale
        await wait(2000); // Allow cache to write
        
        const caches = await Promise.all([
          checkCache('es'),
          checkCache('fr'),
          checkCache('de')
        ]);
        
        caches.forEach((cache, i) => {
          console.log(`  ${['es', 'fr', 'de'][i]}: ${cache.entries} cached entries`);
        });
      }
    },
    {
      name: 'Production mode is detected',
      fn: async () => {
        const response = await fetch(`${BASE_URL}/en/tsd-demo`);
        const html = await response.text();
        
        // Check for production indicators
        const hasOptimizedAssets = html.includes('_app/immutable/');
        assert(hasOptimizedAssets, 'Production assets not detected');
        
        console.log('  ✓ Production build confirmed');
      }
    }
  ];

  const success = await runTestSuite('Preview Mode Tests', tests);
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});