import type { TsdConfig } from '../types.js';

export function transformHtml(html: string, config: Required<TsdConfig>): string {
  // Support both %paraglide.lang% and %tsd.lang% patterns
  const langPattern = /%(paraglide|tsd)\.lang%/g;

  // Get locale from the URL or default
  const locale = config.defaultLocale;

  let transformed = html.replace(langPattern, locale);

  // Inject TSd runtime script
  if (!transformed.includes('/__tsd/runtime.js')) {
    transformed = transformed.replace(
      '</head>',
      `<script type="module" src="/__tsd/runtime.js"></script>\n</head>`
    );
  }

  return transformed;
}
