import type { Locale } from '../types.js';
export declare const localeStore: {
    readonly current: string;
    readonly supported: string[];
    subscribe(fn: (locale: Locale) => void): () => void;
};
export declare function setLocale(locale: Locale): void;
export declare function getLocale(): Locale;
//# sourceMappingURL=locale-store.d.ts.map