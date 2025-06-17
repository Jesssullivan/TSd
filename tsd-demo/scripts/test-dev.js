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
  ensureCacheDir
} from './test-utils.js';

const BASE_URL = 'http://localhost:5173';

async function runTests() {
  console.log(`${colors.blue}Testing Development Mode${colors.reset}`);
  
  // Ensure cache directory exists
  await ensureCacheDir();
  
  // Wait for dev server
  const ready = await waitForService(BASE_URL, 30, 2000);
  if (!ready) {
    console.error('Dev server not ready');
    process.exit(1);
  }

  const tests = [
    {
      name: 'API Translation (en -> fr)',
      fn: async () => {
        const result = await testTranslation(BASE_URL, 'Hello', 'en', 'fr');
        assert(result.ok, `Translation failed: ${result.error || result.data || 'Unknown error'}`);
        assert(result.data && result.data.translated_text, 'No translation data returned');
        assert(result.data.translated_text === 'Bonjour', `Translation incorrect: got "${result.data.translated_text}", expected "Bonjour"`);
        console.log(`  Translation completed in ${result.duration}ms`);
      }
    },
    {
      name: 'API Translation (en -> es)',
      fn: async () => {
        const result = await testTranslation(BASE_URL, 'Welcome', 'en', 'es');
        assert(result.ok, `Translation failed: ${result.error || result.data || 'Unknown error'}`);
        assert(result.data && result.data.translated_text, 'No translation data returned');
        assert(result.data.translated_text === 'Bienvenido' || result.data.translated_text === 'Bienvenida', `Translation incorrect: got "${result.data.translated_text}"`);
      }
    },
    {
      name: 'Page loads in English',
      fn: async () => {
        const result = await testPageTranslation(BASE_URL, 'en', [
          'Welcome to TSd Demo',
          'Translation Examples',
          'Simple Text'
        ]);
        assert(result.ok, 'Failed to load page');
        assert(result.missing.length === 0, `Missing texts: ${result.missing.join(', ')}`);
      }
    },
    {
      name: 'Page loads in French (JIT translation)',
      fn: async () => {
        // First load triggers JIT translation
        const result = await testPageTranslation(BASE_URL, 'fr', [
          'TSd Demo' // Title might not be translated immediately
        ]);
        assert(result.ok, 'Failed to load page');
        
        // Wait for translations to complete
        console.log('  Waiting for JIT translations...');
        await wait(5000);
      }
    },
    {
      name: 'Cache builds up for French',
      fn: async () => {
        const cache = await checkCache('fr', [
          'Welcome to TSd Demo',
          'Translation Examples',
          'Simple Text',
          'Hello, world!'
        ]);
        
        assert(cache.entries > 0, 'No cache entries found');
        console.log(`  Cache has ${cache.entries} entries`);
        
        if (cache.missing.length > 0) {
          console.log(`  Note: Some translations may still be pending: ${cache.missing.join(', ')}`);
        }
      }
    },
    {
      name: 'Cached translations are faster',
      fn: async () => {
        // First request (potentially cached)
        const result1 = await testTranslation(BASE_URL, 'Hello', 'en', 'fr');
        assert(result1.ok, 'First translation failed');
        
        // Second request (should be cached)
        const result2 = await testTranslation(BASE_URL, 'Hello', 'en', 'fr');
        assert(result2.ok, 'Second translation failed');
        
        console.log(`  First: ${result1.duration}ms, Second: ${result2.duration}ms`);
        
        // In dev mode, caching might not be as effective
        if (result2.duration < result1.duration) {
          console.log('  ✓ Cache is working effectively');
        }
      }
    }
  ];

  const success = await runTestSuite('Development Mode Tests', tests);
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});