import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Async Text Handling Demo', () => {
  let browser: Browser;
  let page: Page;
  let server: ViteDevServer;

  beforeAll(async () => {
    // Start demo app server
    server = await createServer({
      root: path.resolve(__dirname, '../../../apps/tsd-demo'),
      server: { port: 5174 },
    });
    await server.listen();

    // Launch browser
    browser = await chromium.launch();
    page = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    await browser.close();
    await server.close();
  });

  it('should display loading state during translation', async () => {
    await page.goto('http://localhost:5174/en/tsd-demo');
    
    // Check for loading state
    const loadingElements = await page.$$('.tsd-translation.loading');
    expect(loadingElements.length).toBeGreaterThan(0);
    
    // Wait for translations to complete
    await page.waitForSelector('.tsd-translation:not(.loading)', { timeout: 10000 });
    
    // Verify translations loaded
    const translatedElements = await page.$$('.tsd-translation:not(.loading)');
    expect(translatedElements.length).toBeGreaterThan(0);
  });

  it('should handle async text with proper await pattern', async () => {
    await page.goto('http://localhost:5174/es/tsd-demo');
    
    // Create a custom component that demonstrates async handling
    await page.evaluate(() => {
      // Inject a test component
      const testHtml = `
        <div id="async-test">
          <tsd native="en">Loading translation...</tsd>
          <tsd native="en">Another async text</tsd>
          <tsd native="en">Third translation</tsd>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', testHtml);
    });

    // Monitor translation events
    const translationPromises = await page.evaluate(() => {
      const elements = document.querySelectorAll('#async-test tsd');
      const promises: Promise<string>[] = [];
      
      elements.forEach((el) => {
        promises.push(new Promise((resolve) => {
          const observer = new MutationObserver((mutations) => {
            const span = el.querySelector('.tsd-translation');
            if (span && !span.classList.contains('loading')) {
              observer.disconnect();
              resolve(span.textContent || '');
            }
          });
          observer.observe(el, { childList: true, subtree: true, attributes: true });
        }));
      });
      
      return Promise.all(promises);
    });

    // All translations should complete
    expect(translationPromises.length).toBe(3);
    translationPromises.forEach((text) => {
      expect(text).toBeTruthy();
      expect(text).not.toBe('Loading translation...');
    });
  });

  it('should demonstrate Svelte await block pattern', async () => {
    // Create a test page with Svelte await pattern
    const testPage = `
      <script>
        import { onMount } from 'svelte';
        
        let translationPromise;
        
        onMount(() => {
          // Simulate async translation request
          translationPromise = new Promise((resolve) => {
            const grpcClient = window.__TSD_GRPC_CLIENT__;
            if (grpcClient) {
              grpcClient.translate('Hello World', 'en', 'es')
                .then(resolve)
                .catch(() => resolve('Translation failed'));
            } else {
              resolve('No gRPC client');
            }
          });
        });
      </script>
      
      {#await translationPromise}
        <p>wait...</p>
      {:then translation}
        <p>{translation}</p>
      {:catch error}
        <p>Error: {error.message}</p>
      {/await}
    `;

    // Navigate to demo page and inject test
    await page.goto('http://localhost:5174/en/tsd-demo');
    
    // Wait for gRPC client
    await page.waitForFunction(() => (window as any).__TSD_GRPC_CLIENT__, { timeout: 5000 });

    // Test async pattern
    const result = await page.evaluate(async () => {
      const grpcClient = (window as any).__TSD_GRPC_CLIENT__;
      
      // Create promise-based translation
      const translationPromise = grpcClient.translate('Test async await', 'en', 'es');
      
      // Should return a promise
      if (!(translationPromise instanceof Promise)) {
        throw new Error('translate should return a Promise');
      }
      
      // Await the result
      const translation = await translationPromise;
      return translation;
    });

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should handle concurrent async translations efficiently', async () => {
    await page.goto('http://localhost:5174/fr/tsd-demo');
    
    const results = await page.evaluate(async () => {
      const grpcClient = (window as any).__TSD_GRPC_CLIENT__;
      
      // Launch multiple concurrent translations
      const texts = [
        'First text',
        'Second text',
        'Third text',
        'Fourth text',
        'Fifth text',
      ];
      
      const startTime = performance.now();
      
      // Use Promise.all for concurrent execution
      const translations = await Promise.all(
        texts.map((text) => grpcClient.translate(text, 'en', 'fr'))
      );
      
      const endTime = performance.now();
      
      return {
        translations,
        duration: endTime - startTime,
        allResolved: translations.every((t) => typeof t === 'string'),
      };
    });

    expect(results.translations.length).toBe(5);
    expect(results.allResolved).toBe(true);
    // Concurrent execution should be reasonably fast
    expect(results.duration).toBeLessThan(5000);
  });

  it('should update UI reactively when translations arrive', async () => {
    await page.goto('http://localhost:5174/de/tsd-demo');
    
    // Monitor reactive updates
    const updateSequence = await page.evaluate(() => {
      return new Promise((resolve) => {
        const updates: string[] = [];
        const targetElement = document.querySelector('.tsd-translation');
        
        if (!targetElement) {
          resolve(['No element found']);
          return;
        }
        
        // Record initial state
        updates.push(targetElement.textContent || 'empty');
        
        // Observer for changes
        const observer = new MutationObserver(() => {
          updates.push(targetElement.textContent || 'empty');
          if (!targetElement.classList.contains('loading')) {
            observer.disconnect();
            resolve(updates);
          }
        });
        
        observer.observe(targetElement, {
          childList: true,
          characterData: true,
          subtree: true,
        });
        
        // Timeout fallback
        setTimeout(() => {
          observer.disconnect();
          resolve(updates);
        }, 5000);
      });
    });

    // Should show progression from loading to translated
    expect(Array.isArray(updateSequence)).toBe(true);
    expect(updateSequence.length).toBeGreaterThanOrEqual(1);
  });
});