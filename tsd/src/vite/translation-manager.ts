import type { TsdConfig, TranslationMap, TranslationEntry, Locale, TranslationMonad } from '../types.js';
import { createTranslationMonad, createAsyncTranslationMonad, failedTranslation } from '../lib/translation-monad.js';
import { LibreTranslateClient } from '../lib/libretranslate-client.js';
import * as path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import * as crypto from 'node:crypto';

export function createTranslationManager(config: Required<TsdConfig>) {
  const translationMap: TranslationMap = {};
  const cacheFile = path.join(config.cacheDir, 'translations.json');
  const translator = new LibreTranslateClient(config.translationProvider);

  async function loadCache() {
    try {
      const data = await readFile(cacheFile, 'utf-8');
      const cached = JSON.parse(data) as TranslationMap;
      Object.assign(translationMap, cached);
    } catch (error) {
      // Cache doesn't exist yet, that's fine
    }
  }

  async function saveCache() {
    await writeFile(cacheFile, JSON.stringify(translationMap, null, 2));
  }

  function generateKey(text: string, native: Locale): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${text}:${native}`);
    return hash.digest('hex').substring(0, 16);
  }

  function getOrCreateTranslation(
    text: string,
    native: Locale,
    targetLocale: Locale
  ): TranslationMonad<string> {
    const key = generateKey(text, native);

    // Create entry if it doesn't exist
    if (!translationMap[key]) {
      translationMap[key] = {
        key,
        native,
        text,
        translations: {
          [native]: text,
        },
      };
    }

    const entry = translationMap[key];

    // Return existing translation if available
    if (entry.translations[targetLocale]) {
      return createTranslationMonad(entry.translations[targetLocale]);
    }

    // No translation needed for same locale
    if (native === targetLocale) {
      return createTranslationMonad(text);
    }

    // Use async monad for translation
    const translationPromise = translator.translate(text, native, targetLocale)
      .then(async (translated) => {
        if (translated) {
          entry.translations[targetLocale] = translated;
          await saveCache();
          return translated;
        }
        return text;
      })
      .catch((error) => {
        console.error('[TSd] Translation error:', error);
        return text;
      });

    return createAsyncTranslationMonad(translationPromise);
  }

  function addTranslationRequest(text: string, native: Locale): TranslationMonad<string> {
    const key = generateKey(text, native);

    if (!translationMap[key]) {
      translationMap[key] = {
        key,
        native,
        text,
        translations: {
          [native]: text,
        },
      };

      // Trigger translation for all supported locales using monads
      for (const locale of config.supportedLocales) {
        if (locale !== native) {
          // Fire and forget - translations happen in background
          const monad = getOrCreateTranslation(text, native, locale);
          const value = monad.value();
          if (value instanceof Promise) {
            value
              .then((result) => {
                if (!result) {
                  console.warn(`[TSd] Failed to translate "${text}" to ${locale}`);
                }
              })
              .catch(console.error);
          }
        }
      }
    }

    return createTranslationMonad(key);
  }

  async function getTranslations(): Promise<TranslationMap> {
    return { ...translationMap };
  }

  function getTranslation(key: string, locale: Locale): TranslationMonad<string> {
    const entry = translationMap[key];
    const translation = entry?.translations[locale] || entry?.text;
    return translation ? createTranslationMonad(translation) : failedTranslation();
  }

  // Helper function to get a translation synchronously (for backwards compatibility)
  async function getTranslationValue(
    text: string,
    native: Locale,
    targetLocale: Locale
  ): Promise<string> {
    const monad = getOrCreateTranslation(text, native, targetLocale);
    return monad.getOrElse(text);
  }

  return {
    loadCache,
    saveCache,
    getOrCreateTranslation,
    getTranslationValue,
    addTranslationRequest,
    getTranslations,
    getTranslation,
  };
}
