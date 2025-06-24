import type { Locale } from '../types.js';

// Simple store without Svelte 5 runes
let currentLocale: Locale = 'en';
let supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
const subscribers = new Set<(locale: Locale) => void>();

function detectLocaleFromUrl(): Locale | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  const match = pathname.match(/^\/([a-z]{2})(?:\/|$)/);

  if (match && supportedLocales.includes(match[1] as Locale)) {
    return match[1] as Locale;
  }

  return null;
}

// Initialize from window config if available
if (typeof window !== 'undefined' && (window as any).__TSD_CONFIG__) {
  currentLocale = detectLocaleFromUrl() || (window as any).__TSD_CONFIG__.defaultLocale;
  supportedLocales = (window as any).__TSD_CONFIG__.supportedLocales;
} else if (typeof window !== 'undefined') {
  // Browser without config - detect from URL
  currentLocale = detectLocaleFromUrl() || 'en';
}

function notifySubscribers() {
  subscribers.forEach((fn) => fn(currentLocale));
}

export const localeStore = {
  get current() {
    return currentLocale;
  },

  get supported() {
    return supportedLocales;
  },

  subscribe(fn: (locale: Locale) => void) {
    subscribers.add(fn);
    fn(currentLocale); // Call immediately with current value

    // Return unsubscribe function
    return () => {
      subscribers.delete(fn);
    };
  },
};

export function setLocale(locale: Locale) {
  if (!supportedLocales.includes(locale)) {
    console.warn(`[TSd] Locale "${locale}" is not supported`);
    return;
  }

  const previousLocale = currentLocale;
  currentLocale = locale;

  // Update URL if in browser
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const pathname = url.pathname;

    // Remove existing locale from path
    const cleanPath = pathname.replace(/^\/[a-z]{2}(?:\/|$)/, '/');

    // Add new locale
    const newPath = `/${locale}${cleanPath}`;

    // Check if we're in SvelteKit by looking for goto function
    if (typeof window !== 'undefined' && '__sveltekit' in window) {
      // In SvelteKit, dispatch event and let the app handle navigation
      window.dispatchEvent(
        new CustomEvent('tsd:locale-navigate', {
          detail: { path: newPath, locale, previousLocale },
        })
      );
    } else {
      // Fallback for non-SvelteKit environments
      window.history.pushState({}, '', newPath);
    }

    // Dispatch locale change event
    window.dispatchEvent(
      new CustomEvent('tsd:locale-changed', {
        detail: { locale, previousLocale },
      })
    );
  }

  notifySubscribers();
}

export function getLocale(): Locale {
  return currentLocale;
}

// Auto-detect locale on initialization
if (typeof window !== 'undefined') {
  // Listen for popstate to handle browser back/forward
  window.addEventListener('popstate', () => {
    const detectedLocale = detectLocaleFromUrl();
    if (detectedLocale && detectedLocale !== currentLocale) {
      currentLocale = detectedLocale;
      notifySubscribers();
    }
  });
}
