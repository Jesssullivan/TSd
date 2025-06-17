import type { TsdConfig, TranslationMap, Locale, TranslationMonad } from '../types.js';
export declare function createTranslationManager(config: Required<TsdConfig>): {
    loadCache: () => Promise<void>;
    saveCache: () => Promise<void>;
    getOrCreateTranslation: (text: string, native: Locale, targetLocale: Locale) => TranslationMonad<string>;
    getTranslationValue: (text: string, native: Locale, targetLocale: Locale) => Promise<string>;
    addTranslationRequest: (text: string, native: Locale) => TranslationMonad<string>;
    getTranslations: () => Promise<TranslationMap>;
    getTranslation: (key: string, locale: Locale) => TranslationMonad<string>;
};
//# sourceMappingURL=translation-manager.d.ts.map