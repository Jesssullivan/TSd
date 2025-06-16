import type { TranslationMonad } from '../types.js';
/**
 * Creates a translation monad for handling translation operations in a functional way.
 * Supports both sync and async operations with proper error handling.
 */
export declare function createTranslationMonad<T>(value?: T): TranslationMonad<T>;
/**
 * Creates an async translation monad for handling asynchronous translation operations.
 */
export declare function createAsyncTranslationMonad<T>(promise: Promise<T>): TranslationMonad<T>;
/**
 * Utility function to chain multiple translation monads
 */
export declare function chainTranslations<T>(...monads: TranslationMonad<T>[]): TranslationMonad<T[]>;
/**
 * Utility function to create a failed translation monad
 */
export declare function failedTranslation<T>(error?: Error): TranslationMonad<T>;
//# sourceMappingURL=translation-monad.d.ts.map