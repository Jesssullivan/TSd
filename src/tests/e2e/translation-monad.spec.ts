import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  createTranslationMonad,
  createAsyncTranslationMonad,
  chainTranslations,
  failedTranslation,
} from '../../src/lib/translation-monad';
import type { TranslationMonad } from '../../src/types';

describe('Translation Monad E2E Tests', () => {
  describe('Synchronous Operations', () => {
    it('should create a monad with a value', () => {
      const monad = createTranslationMonad('Hello');
      expect(monad.value()).toBe('Hello');
      expect(monad.getOrElse('Default')).toBe('Hello');
    });

    it('should create an empty monad', () => {
      const monad = createTranslationMonad<string>();
      expect(monad.value()).toBeUndefined();
      expect(monad.getOrElse('Default')).toBe('Default');
    });

    it('should map values correctly', () => {
      const monad = createTranslationMonad('Hello')
        .map((text) => text.toUpperCase())
        .map((text) => `${text}!`);

      expect(monad.value()).toBe('HELLO!');
    });

    it('should handle map on empty monad', () => {
      const monad = createTranslationMonad<string>()
        .map((text) => text.toUpperCase())
        .map((text) => `${text}!`);

      expect(monad.value()).toBeUndefined();
      expect(monad.getOrElse('FAILED')).toBe('FAILED');
    });

    it('should flatMap correctly', () => {
      const monad = createTranslationMonad('Hello')
        .flatMap((text) => createTranslationMonad(`${text} World`))
        .flatMap((text) => createTranslationMonad(text.toUpperCase()));

      expect(monad.value()).toBe('HELLO WORLD');
    });

    it('should handle errors in map gracefully', () => {
      const monad = createTranslationMonad({ text: 'Hello' })
        .map((obj: any) => obj.nonExistent.property)
        .map((text: any) => text.toUpperCase());

      expect(monad.value()).toBeUndefined();
    });

    it('should handle errors in flatMap gracefully', () => {
      const monad = createTranslationMonad('Hello')
        .flatMap((text) => {
          throw new Error('Test error');
        })
        .map((text: any) => text.toUpperCase());

      expect(monad.value()).toBeUndefined();
    });
  });

  describe('Asynchronous Operations', () => {
    it('should handle async values', async () => {
      const promise = Promise.resolve('Hello Async');
      const monad = createAsyncTranslationMonad(promise);

      const value = await monad.value();
      expect(value).toBe('Hello Async');

      const orElse = await monad.getOrElse('Default');
      expect(orElse).toBe('Hello Async');
    });

    it('should handle async map operations', async () => {
      const promise = Promise.resolve('hello');
      const monad = createAsyncTranslationMonad(promise)
        .map((text) => text.toUpperCase())
        .map((text) => `${text} WORLD`);

      const value = await monad.value();
      expect(value).toBe('HELLO WORLD');
    });

    it('should handle async flatMap operations', async () => {
      const promise = Promise.resolve('hello');
      const monad = createAsyncTranslationMonad(promise)
        .flatMap((text) => createTranslationMonad(`${text} world`))
        .flatMap((text) => createAsyncTranslationMonad(Promise.resolve(text.toUpperCase())));

      const value = await monad.value();
      expect(value).toBe('HELLO WORLD');
    });

    it('should handle rejected promises', async () => {
      const promise = Promise.reject(new Error('Test error'));
      const monad = createAsyncTranslationMonad<string>(promise);

      const value = await monad.value();
      expect(value).toBeUndefined();

      const orElse = await monad.getOrElse('Default');
      expect(orElse).toBe('Default');
    });

    it('should handle errors in async map', async () => {
      const promise = Promise.resolve({ text: 'hello' });
      const monad = createAsyncTranslationMonad(promise)
        .map((obj: any) => obj.nonExistent.property);

      const value = await monad.value();
      expect(value).toBeUndefined();
    });

    it('should handle errors in async flatMap', async () => {
      const promise = Promise.resolve('hello');
      const monad = createAsyncTranslationMonad(promise)
        .flatMap((text) => {
          throw new Error('Test error');
        });

      const value = await monad.value();
      expect(value).toBeUndefined();
    });
  });

  describe('Utility Functions', () => {
    it('should chain multiple monads', () => {
      const monad1 = createTranslationMonad('Hello');
      const monad2 = createTranslationMonad('World');
      const monad3 = createTranslationMonad<string>();

      const chained = chainTranslations(monad1, monad2, monad3);
      const value = chained.value();

      expect(value).toEqual(['Hello', 'World']);
    });

    it('should handle empty chain', () => {
      const monad1 = createTranslationMonad<string>();
      const monad2 = createTranslationMonad<string>();

      const chained = chainTranslations(monad1, monad2);
      const value = chained.value();

      expect(value).toBeUndefined();
    });

    it('should create failed translation monad', () => {
      const monad = failedTranslation<string>(new Error('Translation failed'));

      expect(monad.value()).toBeUndefined();
      expect(monad.getOrElse('Fallback')).toBe('Fallback');
    });
  });

  // Mock translation service
  const mockTranslate = async (text: string, from: string, to: string): Promise<string> => {
    if (text === 'error') {
      throw new Error('Translation service error');
    }
    return `[${to}] ${text}`;
  };

  describe('Real-world Translation Scenarios', () => {

    it('should handle successful translation pipeline', async () => {
      const translationPipeline = (text: string, from: string, to: string) => {
        return createAsyncTranslationMonad(mockTranslate(text, from, to))
          .map((translated) => translated.trim())
          .map((translated) => {
            // Post-process: capitalize first letter
            return translated.charAt(0).toUpperCase() + translated.slice(1);
          });
      };

      const result = await translationPipeline('hello world', 'en', 'es').value();
      expect(result).toBe('[es] hello world');
    });

    it('should handle translation errors gracefully', async () => {
      const translationPipeline = (text: string, from: string, to: string) => {
        return createAsyncTranslationMonad(mockTranslate(text, from, to))
          .map((translated) => translated.trim())
          .map((translated) => translated.toUpperCase());
      };

      const result = await translationPipeline('error', 'en', 'es').getOrElse('Translation failed');
      expect(result).toBe('Translation failed');
    });

    it('should handle complex translation chain', async () => {
      const translateWithCache = async (text: string, from: string, to: string) => {
        // Simulate cache check
        const cacheKey = `${text}-${from}-${to}`;
        const cached = cacheKey === 'hello-en-es' ? '[cached] hola' : null;

        if (cached) {
          return createTranslationMonad(cached);
        }

        // Fall back to translation service
        return createAsyncTranslationMonad(mockTranslate(text, from, to));
      };

      const result1 = await (await translateWithCache('hello', 'en', 'es')).value();
      expect(result1).toBe('[cached] hola');

      const result2 = await (await translateWithCache('world', 'en', 'es')).value();
      expect(result2).toBe('[es] world');
    });

    it('should handle batch translations', async () => {
      const texts = ['hello', 'world', 'error', 'test'];
      
      const translations = await Promise.all(
        texts.map(async (text) => {
          const monad = createAsyncTranslationMonad(mockTranslate(text, 'en', 'es'));
          return monad.getOrElse(`[fallback] ${text}`);
        })
      );

      expect(translations).toEqual([
        '[es] hello',
        '[es] world',
        '[fallback] error',
        '[es] test',
      ]);
    });
  });

  describe('Integration with Translation Manager', () => {
    it('should work with monad-based translation manager', async () => {
      // Simulate translation manager behavior
      const translationMap = new Map<string, Map<string, string>>();

      const getOrCreateTranslation = (text: string, native: string, target: string): TranslationMonad<string> => {
        const key = `${text}-${native}`;
        
        if (!translationMap.has(key)) {
          translationMap.set(key, new Map([[native, text]]));
        }

        const translations = translationMap.get(key)!;
        
        if (translations.has(target)) {
          return createTranslationMonad(translations.get(target)!);
        }

        if (native === target) {
          return createTranslationMonad(text);
        }

        // Simulate async translation
        return createAsyncTranslationMonad(
          mockTranslate(text, native, target).then((translated) => {
            translations.set(target, translated);
            return translated;
          })
        );
      };

      // Test translation flow
      const monad1 = getOrCreateTranslation('Hello', 'en', 'es');
      const result1 = await monad1.getOrElse('Failed');
      expect(result1).toBe('[es] Hello');

      // Test cached translation
      const monad2 = getOrCreateTranslation('Hello', 'en', 'es');
      const result2 = await monad2.getOrElse('Failed');
      expect(result2).toBe('[es] Hello');

      // Test same locale
      const monad3 = getOrCreateTranslation('Hello', 'en', 'en');
      const result3 = await monad3.getOrElse('Failed');
      expect(result3).toBe('Hello');
    });
  });

  describe('Function → Reduce System', () => {
    it('should demonstrate function composition with reduce', async () => {
      // Define a set of transformation functions
      const transformations = [
        (text: string) => text.trim(),
        (text: string) => text.toLowerCase(),
        (text: string) => text.replace(/\s+/g, '-'),
        (text: string) => `slug-${text}`,
      ];

      // Use reduce to compose functions with monads
      const composedTransform = (initialText: string) => {
        return transformations.reduce(
          (monad, transform) => monad.map(transform),
          createTranslationMonad(initialText)
        );
      };

      const result = composedTransform('  Hello World  ').value();
      expect(result).toBe('slug-hello-world');

      // Test with async transformations
      const asyncTransformations = [
        async (text: string) => text.trim(),
        async (text: string) => mockTranslate(text, 'en', 'es'),
        async (text: string) => text.toUpperCase(),
      ];

      const composedAsyncTransform = (initialText: string) => {
        return asyncTransformations.reduce(
          (monadPromise, transform) => {
            return monadPromise.then((monad) =>
              monad.flatMap((text) => createAsyncTranslationMonad(transform(text)))
            );
          },
          Promise.resolve(createTranslationMonad(initialText))
        );
      };

      const asyncResult = await (await composedAsyncTransform('hello')).value();
      expect(asyncResult).toBe('[ES] HELLO');
    });

    it('should handle function map expansion for translations', async () => {
      // Create a function map for translations
      const translationFunctions = new Map<string, (text: string) => TranslationMonad<string>>();
      
      // Add transformation functions for different locales
      translationFunctions.set('es', (text) => 
        createAsyncTranslationMonad(mockTranslate(text, 'en', 'es'))
      );
      translationFunctions.set('fr', (text) => 
        createAsyncTranslationMonad(mockTranslate(text, 'en', 'fr'))
      );
      translationFunctions.set('de', (text) => 
        createAsyncTranslationMonad(mockTranslate(text, 'en', 'de'))
      );

      // Expand function map to translate a text to all locales
      const translateToAllLocales = async (text: string) => {
        const results = new Map<string, string>();
        
        for (const [locale, translateFn] of translationFunctions) {
          const monad = translateFn(text);
          const translated = await monad.getOrElse(text);
          results.set(locale, translated);
        }
        
        return results;
      };

      const allTranslations = await translateToAllLocales('hello');
      
      // Verify all locales have translations
      expect(allTranslations.size).toBe(3);
      expect(allTranslations.get('es')).toBe('[es] hello');
      expect(allTranslations.get('fr')).toBe('[fr] hello');
      expect(allTranslations.get('de')).toBe('[de] hello');
      
      // Verify consistent sizes (all translations should be present)
      const sizes = Array.from(allTranslations.values()).map(t => t.length > 0);
      expect(sizes.every(Boolean)).toBe(true);
    });

    it('should demonstrate monad-based reduce for batch operations', () => {
      const texts = ['Hello', 'World', 'Test', 'Monad'];
      
      // Create a pipeline using reduce
      const pipeline = texts.reduce((chainedMonad, text) => {
        return chainedMonad.flatMap((results) => {
          return createTranslationMonad(text)
            .map((t) => t.toLowerCase())
            .map((t) => [...results, t]);
        });
      }, createTranslationMonad<string[]>([]));
      
      const result = pipeline.value();
      expect(result).toEqual(['hello', 'world', 'test', 'monad']);
    });
  });
});