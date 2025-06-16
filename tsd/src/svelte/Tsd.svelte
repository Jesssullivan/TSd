<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { localeStore } from './locale-store.js';
  import type { Locale } from '../types.js';

  // Props
  export let native: Locale = 'en';

  // State
  let translatedText = '';
  let isLoading = true;
  let key = '';
  let textContent = '';
  let grpcClient: any;
  let unsubscribe: () => void;
  let unsubscribeUpdates: (() => void) | null = null;
  let connectionInfo = {
    protocol: 'unknown',
    environment: 'unknown',
    isEnvoy: false,
  };

  // Get the text content from slot
  let elementRef: HTMLElement;

  onMount(() => {
    // Get initial text content
    if (elementRef) {
      textContent = elementRef.textContent || '';
    }

    // Wait for gRPC client to be available
    let retryCount = 0;
    const checkGrpcClient = () => {
      grpcClient = (window as any).__TSD_GRPC_CLIENT__;

      if (!grpcClient) {
        retryCount++;
        if (retryCount < 50) {
          // Try for 5 seconds
          setTimeout(checkGrpcClient, 100);
        } else {
          console.error('[TSd] gRPC client not available after 5 seconds');
          // Fallback: show original text
          translatedText = textContent;
          isLoading = false;
        }
        return;
      }

      console.log('[TSd] gRPC client found, setting up subscription');

      // Get connection info from client
      if (grpcClient.envoyConfig) {
        connectionInfo = grpcClient.envoyConfig;
      }

      // Subscribe to translation updates
      unsubscribeUpdates = grpcClient.subscribeToUpdates(handleTranslationUpdate);

      // Request initial translation
      requestTranslation();
    };

    // Listen for HMR updates
    window.addEventListener('tsd:translations-updated', handleHMRUpdate);
    window.addEventListener('tsd:locale-changed', handleLocaleChange);

    // Subscribe to locale changes
    unsubscribe = localeStore.subscribe(() => {
      if (grpcClient) {
        requestTranslation();
      }
    });

    // Start checking for gRPC client
    checkGrpcClient();
  });

  onDestroy(() => {
    if (unsubscribeUpdates) {
      unsubscribeUpdates();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('tsd:translations-updated', handleHMRUpdate);
      window.removeEventListener('tsd:locale-changed', handleLocaleChange);
    }
    if (unsubscribe) unsubscribe();
  });

  async function requestTranslation() {
    if (!grpcClient || !textContent) {
      console.log('[TSd] Cannot request translation:', { grpcClient: !!grpcClient, textContent });
      return;
    }

    const currentLocale = localeStore.current;
    console.log('[TSd] Requesting translation:', { text: textContent, native, currentLocale });

    // If current locale is the native locale, no translation needed
    if (currentLocale === native) {
      translatedText = textContent;
      isLoading = false;
      return;
    }

    // Request translation via gRPC
    try {
      translatedText = await grpcClient.translate(textContent, native, currentLocale);
      isLoading = false;
    } catch (error) {
      console.error('[TSd] Translation error:', error);
      // Fallback to original text
      translatedText = textContent;
      isLoading = false;
    }
  }

  function handleTranslationUpdate(update: any) {
    // Handle updates from gRPC stream
    if (update.entry && update.entry.text === textContent) {
      key = update.key;
      const currentLocale = localeStore.current;
      if (update.entry.translations && update.entry.translations[currentLocale]) {
        translatedText = update.entry.translations[currentLocale];
      }
    }
  }

  function handleHMRUpdate(event: Event) {
    const customEvent = event as CustomEvent;
    const translations = customEvent.detail;
    if (key && translations[key]) {
      const entry = translations[key];
      const currentLocale = localeStore.current;
      translatedText = entry.translations[currentLocale] || textContent;
    }
  }

  function handleLocaleChange() {
    requestTranslation();
  }
</script>

<span
  bind:this={elementRef}
  class="tsd-translation"
  class:loading={isLoading}
  title="{connectionInfo.isEnvoy
    ? 'Via Envoy Proxy'
    : 'Direct HTTP'} - {connectionInfo.environment}"
>
  {#if isLoading}
    <slot />
  {:else}
    {translatedText}
  {/if}
</span>

<style>
  .tsd-translation {
    transition: opacity 0.2s ease-in-out;
  }

  .tsd-translation.loading {
    opacity: 0.7;
  }

  /* Visual indicator for Envoy vs HTTP mode */
  .tsd-translation::before {
    content: attr(data-mode);
    position: absolute;
    top: -20px;
    left: 0;
    font-size: 10px;
    color: #666;
    display: none;
  }

  .tsd-translation:hover::before {
    display: block;
  }
</style>
