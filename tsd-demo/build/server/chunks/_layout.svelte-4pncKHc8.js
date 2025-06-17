import { u as push, T as store_get, U as slot, V as unsubscribe_stores, W as bind_props, w as pop, S as getContext } from './exports-WrHD56vS.js';
import './client-CjLkGJl1.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
let currentLocale = "en";
let supportedLocales = ["en"];
const subscribers = /* @__PURE__ */ new Set();
if (typeof window !== "undefined" && window.__TSD_CONFIG__) {
  currentLocale = detectLocaleFromUrl() || window.__TSD_CONFIG__.defaultLocale;
  supportedLocales = window.__TSD_CONFIG__.supportedLocales;
} else {
  currentLocale = "en";
  supportedLocales = ["en", "es", "fr", "de", "ja", "zh"];
}
function detectLocaleFromUrl() {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  if (match && supportedLocales.includes(match[1])) {
    return match[1];
  }
  return null;
}
__name(detectLocaleFromUrl, "detectLocaleFromUrl");
function notifySubscribers() {
  subscribers.forEach((fn) => fn(currentLocale));
}
__name(notifySubscribers, "notifySubscribers");
function setLocale(locale) {
  if (!supportedLocales.includes(locale)) {
    console.warn(`[TSd] Locale "${locale}" is not supported`);
    return;
  }
  const previousLocale = currentLocale;
  currentLocale = locale;
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const pathname = url.pathname;
    const cleanPath = pathname.replace(/^\/[a-z]{2}(?:\/|$)/, "/");
    const newPath = `/${locale}${cleanPath}`;
    if (typeof window !== "undefined" && "__sveltekit" in window) {
      window.dispatchEvent(
        new CustomEvent("tsd:locale-navigate", {
          detail: { path: newPath, locale, previousLocale }
        })
      );
    } else {
      window.history.pushState({}, "", newPath);
    }
    window.dispatchEvent(
      new CustomEvent("tsd:locale-changed", {
        detail: { locale, previousLocale }
      })
    );
  }
  notifySubscribers();
}
__name(setLocale, "setLocale");
function getLocale() {
  return currentLocale;
}
__name(getLocale, "getLocale");
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const detectedLocale = detectLocaleFromUrl();
    if (detectedLocale && detectedLocale !== currentLocale) {
      currentLocale = detectedLocale;
      notifySubscribers();
    }
  });
}
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let data = $$props["data"];
  if (data.locale) {
    setLocale(data.locale);
  }
  if (store_get($$store_subs ??= {}, "$page", page).params.locale) {
    setLocale(store_get($$store_subs ??= {}, "$page", page).params.locale);
  }
  $$payload.out += `<!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!---->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data });
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-4pncKHc8.js.map
