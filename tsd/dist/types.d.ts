export type Locale = string;
export interface TranslationProvider {
    type: 'libretranslate' | 'google' | 'custom';
    apiKey?: string;
    endpoint?: string;
    customTranslate?: (text: string, from: Locale, to: Locale) => Promise<string>;
}
export interface TsdConfig {
    defaultLocale?: Locale;
    supportedLocales?: Locale[];
    translationProvider: TranslationProvider;
    cacheDir?: string;
    enableHMR?: boolean;
    envoy?: {
        autoDiscover?: boolean;
        endpoint?: string;
        kubernetesNamespace?: string;
        serviceName?: string;
        port?: number;
    };
}
export interface TranslationEntry {
    key: string;
    native: Locale;
    text: string;
    translations: Record<Locale, string>;
}
export interface TranslationMap {
    [key: string]: TranslationEntry;
}
export type TranslationMonad<T> = {
    map: <U>(fn: (value: T) => U) => TranslationMonad<U>;
    flatMap: <U>(fn: (value: T) => TranslationMonad<U> | Promise<TranslationMonad<U>>) => TranslationMonad<U>;
    getOrElse: (defaultValue: T) => T | Promise<T>;
    value: () => T | undefined | Promise<T | undefined>;
};
//# sourceMappingURL=types.d.ts.map