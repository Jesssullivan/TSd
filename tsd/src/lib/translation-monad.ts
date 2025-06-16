import type { TranslationMonad } from '../types.js';

/**
 * Creates a translation monad for handling translation operations in a functional way.
 * Supports both sync and async operations with proper error handling.
 */
export function createTranslationMonad<T>(value?: T): TranslationMonad<T> {
  return {
    map<U>(fn: (value: T) => U): TranslationMonad<U> {
      if (value === undefined) {
        return createTranslationMonad<U>();
      }
      try {
        return createTranslationMonad(fn(value));
      } catch (error) {
        console.error('[TSd] Error in monad map:', error);
        return createTranslationMonad<U>();
      }
    },

    flatMap<U>(
      fn: (value: T) => TranslationMonad<U> | Promise<TranslationMonad<U>>
    ): TranslationMonad<U> {
      if (value === undefined) {
        return createTranslationMonad<U>();
      }

      try {
        const result = fn(value);
        // Handle both sync and async results
        if (result && typeof (result as any).then === 'function') {
          // If it's a promise, we need to return an async monad
          return createAsyncTranslationMonad(
            (result as Promise<TranslationMonad<U>>).then(m => m.value())
          ) as TranslationMonad<U>;
        }
        return result as TranslationMonad<U>;
      } catch (error) {
        console.error('[TSd] Error in monad flatMap:', error);
        return createTranslationMonad<U>();
      }
    },

    getOrElse(defaultValue: T): T {
      return value ?? defaultValue;
    },

    value(): T | undefined {
      return value;
    },
  };
}

/**
 * Creates an async translation monad for handling asynchronous translation operations.
 */
export function createAsyncTranslationMonad<T>(
  promise: Promise<T>
): TranslationMonad<T> {
  const asyncValue = promise.catch((error) => {
    console.error('[TSd] Async monad error:', error);
    return undefined;
  });

  return {
    map<U>(fn: (value: T) => U): TranslationMonad<U> {
      const mappedPromise = asyncValue.then((val) => {
        if (val === undefined) return undefined;
        try {
          return fn(val);
        } catch (error) {
          console.error('[TSd] Error in async monad map:', error);
          return undefined;
        }
      });
      return createAsyncTranslationMonad(mappedPromise as Promise<U>);
    },

    flatMap<U>(
      fn: (value: T) => TranslationMonad<U> | Promise<TranslationMonad<U>>
    ): TranslationMonad<U> {
      const flatMappedPromise = asyncValue.then(async (val) => {
        if (val === undefined) return undefined;
        try {
          const result = await fn(val);
          return result.value();
        } catch (error) {
          console.error('[TSd] Error in async monad flatMap:', error);
          return undefined;
        }
      });
      return createAsyncTranslationMonad(flatMappedPromise as Promise<U>);
    },

    async getOrElse(defaultValue: T): Promise<T> {
      const val = await asyncValue;
      return val ?? defaultValue;
    },

    async value(): Promise<T | undefined> {
      return asyncValue;
    },
  } as any; // Type assertion needed due to async overrides
}

/**
 * Utility function to chain multiple translation monads
 */
export function chainTranslations<T>(
  ...monads: TranslationMonad<T>[]
): TranslationMonad<T[]> {
  const values = monads.map((m) => m.value()).filter((v) => v !== undefined) as T[];
  return createTranslationMonad(values.length > 0 ? values : undefined);
}

/**
 * Utility function to create a failed translation monad
 */
export function failedTranslation<T>(error?: Error): TranslationMonad<T> {
  if (error) {
    console.error('[TSd] Translation failed:', error);
  }
  return createTranslationMonad<T>();
}
