import type { TranslationProvider, Locale } from '../types.js';
import { validateTranslationInput, needsTranslation } from './input-validation.js';

export class LibreTranslateClient {
  private cache = new Map<string, string>();

  constructor(private provider: TranslationProvider) {}

  async translate(text: string, from: Locale, to: Locale): Promise<string> {
    // Input validation using centralized validation
    const validation = validateTranslationInput(text);
    
    // Log any warnings from validation
    if (validation.warnings.length > 0) {
      console.warn('[LibreTranslate] Input validation warnings:', validation.warnings);
    }
    
    // If text doesn't need translation, return as-is
    if (!needsTranslation(validation.sanitizedText)) {
      return validation.sanitizedText;
    }
    
    // Use sanitized text for translation
    text = validation.sanitizedText;

    const cacheKey = `${text}:${from}:${to}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let translated: string;

    try {
      switch (this.provider.type) {
        case 'libretranslate':
          translated = await this.translateWithLibreTranslate(text, from, to);
          break;
        case 'google':
          translated = await this.translateWithGoogle(text, from, to);
          break;
        case 'custom':
          if (!this.provider.customTranslate) {
            throw new Error('Custom translate function not provided');
          }
          translated = await this.provider.customTranslate(text, from, to);
          break;
        default:
          throw new Error(`Unknown translation provider: ${this.provider.type}`);
      }

      // Cache the result
      this.cache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.error(`Translation error: ${error}`);
      return text; // Fallback to original text
    }
  }

  private async translateWithLibreTranslate(
    text: string,
    from: Locale,
    to: Locale
  ): Promise<string> {
    const endpoint = this.provider.endpoint || 'https://libretranslate.com/translate';

    console.log('[LibreTranslate] Translating:', { text, from, to, endpoint });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: 'text',
        api_key: this.provider.apiKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LibreTranslate] API error:', response.status, errorText);
      throw new Error(
        `LibreTranslate API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log('[LibreTranslate] Translation result:', data);
    return data.translatedText;
  }

  private async translateWithGoogle(text: string, from: Locale, to: Locale): Promise<string> {
    // Placeholder for Google Translate API implementation
    // This would require proper Google Cloud credentials setup
    throw new Error('Google Translate not implemented yet');
  }
}
