export { tsdVitePlugin } from './vite/index.js';
export { default as Tsd } from './svelte/Tsd.svelte';
export { localeStore, setLocale, getLocale } from './svelte/locale-store.js';
export { createTranslationMonad, createAsyncTranslationMonad, chainTranslations, failedTranslation } from './lib/translation-monad.js';
export type { TsdConfig, TranslationProvider, Locale, TranslationMonad, TranslationEntry, TranslationMap } from './types.js';
