import type { TranslationProvider, Locale } from '../types.js';
export declare class LibreTranslateClient {
    private provider;
    private cache;
    constructor(provider: TranslationProvider);
    translate(text: string, from: Locale, to: Locale): Promise<string>;
    private translateWithLibreTranslate;
    private translateWithGoogle;
}
//# sourceMappingURL=libretranslate-client.d.ts.map