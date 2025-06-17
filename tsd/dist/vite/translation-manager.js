var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { createTranslationMonad, createAsyncTranslationMonad, failedTranslation } from "../lib/translation-monad.js";
import { LibreTranslateClient } from "../lib/libretranslate-client.js";
import * as path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import * as crypto from "node:crypto";
function createTranslationManager(config) {
  const translationMap = {};
  const cacheFile = path.join(config.cacheDir, "translations.json");
  const translator = new LibreTranslateClient(config.translationProvider);
  async function loadCache() {
    try {
      const data = await readFile(cacheFile, "utf-8");
      const cached = JSON.parse(data);
      Object.assign(translationMap, cached);
    } catch (error) {
    }
  }
  __name(loadCache, "loadCache");
  async function saveCache() {
    await writeFile(cacheFile, JSON.stringify(translationMap, null, 2));
  }
  __name(saveCache, "saveCache");
  function generateKey(text, native) {
    const hash = crypto.createHash("sha256");
    hash.update(`${text}:${native}`);
    return hash.digest("hex").substring(0, 16);
  }
  __name(generateKey, "generateKey");
  function getOrCreateTranslation(text, native, targetLocale) {
    const key = generateKey(text, native);
    if (!translationMap[key]) {
      translationMap[key] = {
        key,
        native,
        text,
        translations: {
          [native]: text
        }
      };
    }
    const entry = translationMap[key];
    if (entry.translations[targetLocale]) {
      return createTranslationMonad(entry.translations[targetLocale]);
    }
    if (native === targetLocale) {
      return createTranslationMonad(text);
    }
    const translationPromise = translator.translate(text, native, targetLocale).then(async (translated) => {
      if (translated) {
        entry.translations[targetLocale] = translated;
        await saveCache();
        return translated;
      }
      return text;
    }).catch((error) => {
      console.error("[TSd] Translation error:", error);
      return text;
    });
    return createAsyncTranslationMonad(translationPromise);
  }
  __name(getOrCreateTranslation, "getOrCreateTranslation");
  function addTranslationRequest(text, native) {
    const key = generateKey(text, native);
    if (!translationMap[key]) {
      translationMap[key] = {
        key,
        native,
        text,
        translations: {
          [native]: text
        }
      };
      for (const locale of config.supportedLocales) {
        if (locale !== native) {
          const monad = getOrCreateTranslation(text, native, locale);
          const value = monad.value();
          if (value instanceof Promise) {
            value.then((result) => {
              if (!result) {
                console.warn(`[TSd] Failed to translate "${text}" to ${locale}`);
              }
            }).catch(console.error);
          }
        }
      }
    }
    return createTranslationMonad(key);
  }
  __name(addTranslationRequest, "addTranslationRequest");
  async function getTranslations() {
    return { ...translationMap };
  }
  __name(getTranslations, "getTranslations");
  function getTranslation(key, locale) {
    const entry = translationMap[key];
    const translation = entry?.translations[locale] || entry?.text;
    return translation ? createTranslationMonad(translation) : failedTranslation();
  }
  __name(getTranslation, "getTranslation");
  async function getTranslationValue(text, native, targetLocale) {
    const monad = getOrCreateTranslation(text, native, targetLocale);
    return monad.getOrElse(text);
  }
  __name(getTranslationValue, "getTranslationValue");
  return {
    loadCache,
    saveCache,
    getOrCreateTranslation,
    getTranslationValue,
    addTranslationRequest,
    getTranslations,
    getTranslation
  };
}
__name(createTranslationManager, "createTranslationManager");
export {
  createTranslationManager
};
//# sourceMappingURL=translation-manager.js.map
