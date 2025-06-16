import { tsdVitePlugin } from "./vite/index.js";
import { default as default2 } from "./svelte/Tsd.svelte";
import { localeStore, setLocale, getLocale } from "./svelte/locale-store.js";
import { createTranslationMonad, createAsyncTranslationMonad, chainTranslations, failedTranslation } from "./lib/translation-monad.js";
export {
  default2 as Tsd,
  chainTranslations,
  createAsyncTranslationMonad,
  createTranslationMonad,
  failedTranslation,
  getLocale,
  localeStore,
  setLocale,
  tsdVitePlugin
};
//# sourceMappingURL=index.js.map
