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
const localeStore = {
  get current() {
    return currentLocale;
  },
  get supported() {
    return supportedLocales;
  },
  subscribe(fn) {
    subscribers.add(fn);
    fn(currentLocale);
    return () => {
      subscribers.delete(fn);
    };
  }
};
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
export {
  getLocale,
  localeStore,
  setLocale
};
//# sourceMappingURL=locale-store.js.map
