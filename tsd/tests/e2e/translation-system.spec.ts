import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createTranslationManager } from '../../src/vite/translation-manager';
import { LibreTranslateClient } from '../../src/lib/libretranslate-client';
import type { TsdConfig, TranslationMonad } from '../../src/types';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

// Mock LibreTranslate client
jest.mock('../../src/lib/libretranslate-client');

describe('Translation System E2E Tests', () => {
  let tempDir: string;
  let manager: ReturnType<typeof createTranslationManager>;
  let mockTranslate: jest.MockedFunction<any>;

  const testConfig: Required<TsdConfig> = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'es', 'fr', 'de'],
    translationProvider: {
      type: 'libretranslate',
      endpoint: 'http://localhost:5000',
    },
    cacheDir: '',
    enableHMR: false,
    envoy: {
      autoDiscover: false,
    },
    grpc: {
      enabled: true,
      port: 50052,
    },
    treeshake: true,
  };

  beforeAll(async () => {
    // Create temp directory for cache
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'tsd-test-'));
    testConfig.cacheDir = tempDir;

    // Mock LibreTranslate client
    mockTranslate = jest.fn<Promise<string>, [string, string, string]>().mockImplementation(async (text: string, from: string, to: string) => {
      // Simulate translation
      if (text === 'error') {
        throw new Error('Translation service error');
      }
      return `[${to}] ${text}`;
    });

    (LibreTranslateClient as jest.MockedClass<typeof LibreTranslateClient>).mockImplementation(() => ({
      translate: mockTranslate,
    } as any));

    // Create translation manager
    manager = createTranslationManager(testConfig);
    await manager.loadCache();
  });

  afterAll(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Translation Manager with Monads', () => {
    it('should translate text using monads', async () => {
      const monad = manager.getOrCreateTranslation('Hello World', 'en', 'es');
      const result = await monad.getOrElse('Translation failed');
      
      expect(result).toBe('[es] Hello World');
      expect(mockTranslate).toHaveBeenCalledWith('Hello World', 'en', 'es');
    });

    it('should return cached translation', async () => {
      // First request
      const monad1 = manager.getOrCreateTranslation('Cached Text', 'en', 'fr');
      await monad1.value();

      // Clear mock calls
      mockTranslate.mockClear();

      // Second request should use cache
      const monad2 = manager.getOrCreateTranslation('Cached Text', 'en', 'fr');
      const result = await monad2.getOrElse('Failed');

      expect(result).toBe('[fr] Cached Text');
      expect(mockTranslate).not.toHaveBeenCalled();
    });

    it('should handle same locale without translation', async () => {
      const monad = manager.getOrCreateTranslation('Same Locale', 'en', 'en');
      const result = await monad.getOrElse('Failed');

      expect(result).toBe('Same Locale');
      expect(mockTranslate).not.toHaveBeenCalled();
    });

    it('should handle translation errors gracefully', async () => {
      const monad = manager.getOrCreateTranslation('error', 'en', 'de');
      const result = await monad.getOrElse('Fallback text');

      expect(result).toBe('error'); // Falls back to original text
    });

    it('should add translation request with monad', async () => {
      const keyMonad = manager.addTranslationRequest('New Text', 'en');
      const key = keyMonad.value();

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');

      // Wait for background translations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that translations were triggered for all supported locales
      const translations = await manager.getTranslations();
      const entry = Object.values(translations).find((e) => e.text === 'New Text');

      expect(entry).toBeDefined();
      expect(entry?.translations['en']).toBe('New Text');
      expect(entry?.translations['es']).toBe('[es] New Text');
      expect(entry?.translations['fr']).toBe('[fr] New Text');
      expect(entry?.translations['de']).toBe('[de] New Text');
    });

    it('should get translation by key using monad', async () => {
      // Add a translation first
      const keyMonad = manager.addTranslationRequest('Key Test', 'en');
      const key = keyMonad.value()!;

      // Wait for translations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get translation by key
      const translationMonad = manager.getTranslation(key!, 'es');
      const translation = await translationMonad.getOrElse('Not found');

      expect(translation).toBe('[es] Key Test');
    });

    it('should handle missing translation key', () => {
      const monad = manager.getTranslation('non-existent-key', 'es');
      const result = monad.getOrElse('Default');

      expect(result).toBe('Default');
    });
  });

  describe('Cache Persistence', () => {
    it('should save and load cache', async () => {
      // Add some translations
      await manager.getOrCreateTranslation('Persistent', 'en', 'es').value();
      await manager.getOrCreateTranslation('Cache Test', 'en', 'fr').value();

      // Save cache
      await manager.saveCache();

      // Create new manager and load cache
      const newManager = createTranslationManager(testConfig);
      await newManager.loadCache();

      // Check cached translations are available
      mockTranslate.mockClear();

      const monad1 = newManager.getOrCreateTranslation('Persistent', 'en', 'es');
      const result1 = await monad1.value();
      expect(result1).toBe('[es] Persistent');

      const monad2 = newManager.getOrCreateTranslation('Cache Test', 'en', 'fr');
      const result2 = await monad2.value();
      expect(result2).toBe('[fr] Cache Test');

      // Should not have called translate service
      expect(mockTranslate).not.toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should handle multiple translations efficiently', async () => {
      const texts = [
        'First text',
        'Second text',
        'Third text',
        'Fourth text',
      ];

      const promises = texts.map((text) =>
        manager.getOrCreateTranslation(text, 'en', 'de').getOrElse(text)
      );

      const results = await Promise.all(promises);

      expect(results).toEqual([
        '[de] First text',
        '[de] Second text',
        '[de] Third text',
        '[de] Fourth text',
      ]);
    });

    it('should handle mixed cached and new translations', async () => {
      // Pre-cache some translations
      await manager.getOrCreateTranslation('Cached 1', 'en', 'es').value();
      await manager.getOrCreateTranslation('Cached 2', 'en', 'es').value();

      mockTranslate.mockClear();

      // Mix of cached and new
      const texts = ['Cached 1', 'New 1', 'Cached 2', 'New 2'];
      const promises = texts.map((text) =>
        manager.getOrCreateTranslation(text, 'en', 'es').value()
      );

      const results = await Promise.all(promises);

      expect(results).toEqual([
        '[es] Cached 1',
        '[es] New 1',
        '[es] Cached 2',
        '[es] New 2',
      ]);

      // Should only translate new texts
      expect(mockTranslate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Monad Composition', () => {
    it('should compose translation operations', async () => {
      const translateAndFormat = (text: string, from: string, to: string): TranslationMonad<string> => {
        return manager.getOrCreateTranslation(text, from, to)
          .map((translated) => translated.trim())
          .map((translated) => translated.replace(/\[(\w+)\]/, '($1)'))
          .map((translated) => `${translated} ✓`);
      };

      const result = await translateAndFormat('Composed', 'en', 'fr').getOrElse('Failed');
      expect(result).toBe('(fr) Composed ✓');
    });

    it('should chain multiple translation operations', async () => {
      // Translate to Spanish, then use that as base for German
      const chainedTranslation = async (text: string): Promise<string> => {
        const spanishMonad = manager.getOrCreateTranslation(text, 'en', 'es');
        const spanish = await spanishMonad.getOrElse(text);
        
        // In real scenario, this would translate from Spanish to German
        // For testing, we'll just append
        const germanMonad = manager.getOrCreateTranslation(spanish + ' (via ES)', 'es', 'de');
        return germanMonad.getOrElse(spanish);
      };

      const result = await chainedTranslation('Chain test');
      expect(result).toBe('[de] [es] Chain test (via ES)');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      mockTranslate.mockRejectedValueOnce(new Error('Network error'));

      const monad = manager.getOrCreateTranslation('Network fail', 'en', 'fr');
      const result = await monad.getOrElse('Offline fallback');

      expect(result).toBe('Network fail'); // Falls back to original
    });

    it('should handle invalid locales gracefully', async () => {
      const monad = manager.getOrCreateTranslation('Invalid locale', 'en', 'xyz' as any);
      const result = await monad.getOrElse('Invalid');

      expect(result).toBe('[xyz] Invalid locale');
    });

    it('should handle concurrent translations of same text', async () => {
      mockTranslate.mockClear();

      // Start multiple translations of same text simultaneously
      const promises = Array(5).fill(null).map(() =>
        manager.getOrCreateTranslation('Concurrent', 'en', 'es').value()
      );

      const results = await Promise.all(promises);

      // All should have same result
      expect(results).toEqual(Array(5).fill('[es] Concurrent'));

      // Should only translate once despite concurrent requests
      expect(mockTranslate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large volume of translations', async () => {
      const startTime = Date.now();
      const textCount = 100;

      const promises = Array(textCount).fill(null).map((_, i) =>
        manager.getOrCreateTranslation(`Text ${i}`, 'en', 'es').value()
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(textCount);
      expect(results[0]).toBe('[es] Text 0');
      expect(results[99]).toBe('[es] Text 99');

      // Should complete reasonably fast
      expect(duration).toBeLessThan(5000);
    });

    it('should efficiently handle repeated translations', async () => {
      // Pre-cache a translation
      await manager.getOrCreateTranslation('Repeated', 'en', 'fr').value();

      mockTranslate.mockClear();
      const startTime = Date.now();

      // Request same translation many times
      const promises = Array(1000).fill(null).map(() =>
        manager.getOrCreateTranslation('Repeated', 'en', 'fr').value()
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(1000);
      expect(results.every((r) => r === '[fr] Repeated')).toBe(true);
      expect(mockTranslate).not.toHaveBeenCalled();

      // Cached lookups should be very fast
      expect(duration).toBeLessThan(100);
    });
  });
});