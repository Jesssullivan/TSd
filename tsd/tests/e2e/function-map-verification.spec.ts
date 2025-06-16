import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTranslationManager } from '../../src/vite/translation-manager';
import type { TsdConfig } from '../../src/types';
import { mkdir, rm } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Function Map Expansion and Verification', () => {
  const testCacheDir = path.join(__dirname, '.test-cache');
  let manager: ReturnType<typeof createTranslationManager>;

  beforeAll(async () => {
    // Create test cache directory
    await mkdir(testCacheDir, { recursive: true });

    // Mock LibreTranslate responses
    global.fetch = jest.fn((url, options) => {
      const body = JSON.parse((options as any).body);
      const { q, source, target } = body;
      
      // Simulate translation with consistent pattern
      const translatedText = `[${target}] ${q}`;
      
      return Promise.resolve({
        ok: true,
        json: async () => ({ translatedText }),
      } as Response);
    }) as any;

    // Create translation manager with test config
    const config: Required<TsdConfig> = {
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko'],
      translationProvider: {
        type: 'libretranslate',
        endpoint: 'http://localhost:5000',
        apiKey: 'test-key',
      },
      grpc: {
        enabled: true,
        port: 50052,
      },
      envoy: {
        autoDiscover: false,
        port: 8080,
      },
      cacheDir: testCacheDir,
      enableHMR: false,
      treeshake: true,
    };

    manager = createTranslationManager(config);
    await manager.loadCache();
  });

  afterAll(async () => {
    // Clean up test cache
    await rm(testCacheDir, { recursive: true, force: true });
  });

  it('should expand translation functions across all locales', async () => {
    const testTexts = [
      'Hello World',
      'Welcome to our application',
      'Click here to continue',
      'Settings',
      'Profile',
    ];

    // Add all texts to translation system
    const keys = testTexts.map((text) => 
      manager.addTranslationRequest(text, 'en').value()
    );

    // Wait for initial processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get current translation map
    const translationMap = await manager.getTranslations();

    // Verify each text has an entry
    expect(Object.keys(translationMap).length).toBe(testTexts.length);

    // Verify keys were generated
    keys.forEach((key) => {
      expect(key).toBeTruthy();
      expect(translationMap[key!]).toBeDefined();
    });
  });

  it('should maintain consistent translation sizes across locales', async () => {
    const text = 'Consistency test message';
    const nativeLocale = 'en';

    // Request translation for all supported locales
    const locales = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko'];
    
    // Add translation request
    manager.addTranslationRequest(text, nativeLocale);

    // Wait for all translations to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get translation map
    const translationMap = await manager.getTranslations();
    
    // Find the entry for our text
    const entry = Object.values(translationMap).find((e) => e.text === text);
    expect(entry).toBeDefined();

    // Verify all locales have translations
    const translatedLocales = Object.keys(entry!.translations);
    
    // Should have native + all requested locales
    expect(translatedLocales.length).toBeGreaterThanOrEqual(locales.length);
    expect(translatedLocales).toContain(nativeLocale);

    // Verify all translations exist and are non-empty
    locales.forEach((locale) => {
      const translation = entry!.translations[locale];
      expect(translation).toBeDefined();
      expect(translation.length).toBeGreaterThan(0);
    });

    // Verify translation pattern consistency
    locales.forEach((locale) => {
      const translation = entry!.translations[locale];
      expect(translation).toBe(`[${locale}] ${text}`);
    });
  });

  it('should verify function map expansion on cache server side', async () => {
    // Create a batch of texts
    const batchTexts = Array.from({ length: 10 }, (_, i) => `Test text ${i + 1}`);
    
    // Add all texts
    batchTexts.forEach((text) => {
      manager.addTranslationRequest(text, 'en');
    });

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Save cache
    await manager.saveCache();

    // Create new manager instance to verify cache persistence
    const newManager = createTranslationManager({
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko'],
      translationProvider: {
        type: 'libretranslate',
        endpoint: 'http://localhost:5000',
        apiKey: 'test-key',
      },
      grpc: {
        enabled: true,
        port: 50052,
      },
      envoy: {
        autoDiscover: false,
        port: 8080,
      },
      cacheDir: testCacheDir,
      enableHMR: false,
      treeshake: true,
    });

    await newManager.loadCache();
    const cachedMap = await newManager.getTranslations();

    // Verify all texts are in cache
    const cachedTexts = Object.values(cachedMap).map((entry) => entry.text);
    batchTexts.forEach((text) => {
      expect(cachedTexts).toContain(text);
    });

    // Verify each entry has consistent locale coverage
    Object.values(cachedMap).forEach((entry) => {
      if (batchTexts.includes(entry.text)) {
        const localeCount = Object.keys(entry.translations).length;
        // Should have at least native + 7 translated locales
        expect(localeCount).toBeGreaterThanOrEqual(8);
      }
    });
  });

  it('should demonstrate monadic function composition for translation expansion', async () => {
    const text = 'Monad composition test';
    
    // Create a function map for different transformation + translation operations
    const functionMap = new Map<string, (text: string) => Promise<string>>();
    
    // Add transformation functions for each locale
    const supportedLocales = ['es', 'fr', 'de', 'it'];
    
    supportedLocales.forEach((locale) => {
      functionMap.set(locale, async (input: string) => {
        // Get translation monad
        const monad = manager.getOrCreateTranslation(input, 'en', locale);
        
        // Apply transformations
        const transformed = monad
          .map((translated) => translated.trim())
          .map((translated) => {
            // Add locale-specific formatting
            switch (locale) {
              case 'es':
                return `¡${translated}!`;
              case 'fr':
                return `« ${translated} »`;
              case 'de':
                return `„${translated}"`;
              case 'it':
                return `"${translated}"`;
              default:
                return translated;
            }
          });
        
        return transformed.getOrElse(input);
      });
    });

    // Execute all functions and collect results
    const results = new Map<string, string>();
    
    for (const [locale, fn] of functionMap) {
      const result = await fn(text);
      results.set(locale, result);
    }

    // Verify all locales produced results
    expect(results.size).toBe(supportedLocales.length);
    
    // Verify formatting was applied
    expect(results.get('es')).toMatch(/^¡.*!$/);
    expect(results.get('fr')).toMatch(/^« .* »$/);
    expect(results.get('de')).toMatch(/^„.*"$/);
    expect(results.get('it')).toMatch(/^".*"$/);
  });

  it('should verify translation cache grows consistently', async () => {
    // Get initial cache size
    const initialMap = await manager.getTranslations();
    const initialSize = Object.keys(initialMap).length;

    // Add a new batch of translations
    const newTexts = [
      'Cache growth test 1',
      'Cache growth test 2',
      'Cache growth test 3',
    ];

    // Add texts and track keys
    const newKeys = newTexts.map((text) =>
      manager.addTranslationRequest(text, 'en').value()
    );

    // Wait for translations
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Get updated map
    const updatedMap = await manager.getTranslations();
    const updatedSize = Object.keys(updatedMap).length;

    // Verify cache grew by expected amount
    expect(updatedSize).toBe(initialSize + newTexts.length);

    // Verify new entries have consistent locale coverage
    newKeys.forEach((key) => {
      if (key) {
        const entry = updatedMap[key];
        expect(entry).toBeDefined();
        
        // Should have translations for all supported locales
        const translationCount = Object.keys(entry.translations).length;
        expect(translationCount).toBeGreaterThanOrEqual(8); // en + 7 other locales
      }
    });
  });
});