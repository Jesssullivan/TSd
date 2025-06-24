<script lang="ts">
  import { onMount } from 'svelte';
  import { localeStore } from './locale-store.js';
  import type { Locale } from '../types.js';
  import type { Snippet } from 'svelte';
  import { TsdGrpcClient } from '../client/grpc-client.js';

  interface Props {
    native?: Locale;
    children?: Snippet;
  }

  let { native = 'en', children }: Props = $props();

  let translatedText = $state('');
  let isLoading = $state(true);
  let textContent = $state('');
  let grpcClient: any = $state(null);
  let connectionInfo = $state({
    protocol: 'unknown',
    environment: 'unknown',
    isEnvoy: false,
  });

  let containerRef: HTMLElement;
  let unsubscribeUpdates: (() => void) | null = null;

  // Subscribe to locale changes
  let currentLocale = $state(localeStore.current);
  
  $effect(() => {
    const unsubscribe = localeStore.subscribe((locale) => {
      currentLocale = locale;
      if (grpcClient && textContent) {
        requestTranslation();
      }
    });
    
    return unsubscribe;
  });

  onMount(() => {
    // Extract text content after mount
    const extractText = () => {
      if (containerRef && containerRef.firstChild) {
        const text = containerRef.textContent || '';
        textContent = text.trim();
        console.log('[TSd] Extracted text content:', textContent);
      }
    };

    // Give Svelte time to render the content
    requestAnimationFrame(() => {
      extractText();
      
      // Create gRPC client if not already available
      if (!(window as any).__TSD_GRPC_CLIENT__) {
        console.log('[TSd] Creating gRPC client');
        const client = new TsdGrpcClient({
          host: window.location.hostname,
          port: 50051,
          envoy: (window as any).__TSD_CONFIG__?.envoy || {},
        });
        (window as any).__TSD_GRPC_CLIENT__ = client;
      }
      
      grpcClient = (window as any).__TSD_GRPC_CLIENT__;
      console.log('[TSd] gRPC client initialized');

      // Get connection info from client
      if (grpcClient.envoyConfig) {
        connectionInfo = grpcClient.envoyConfig;
      }

      // Subscribe to translation updates
      unsubscribeUpdates = grpcClient.subscribeToUpdates(handleTranslationUpdate);

      // Request initial translation
      requestTranslation();
    });

    // Listen for HMR updates
    window.addEventListener('tsd:translations-updated', handleHMRUpdate);
    window.addEventListener('tsd:locale-changed', handleLocaleChange);

    return () => {
      if (unsubscribeUpdates) {
        unsubscribeUpdates();
      }
      window.removeEventListener('tsd:translations-updated', handleHMRUpdate);
      window.removeEventListener('tsd:locale-changed', handleLocaleChange);
    };
  });

  async function requestTranslation() {
    if (!grpcClient || !textContent) {
      console.log('[TSd] Cannot request translation:', { grpcClient: !!grpcClient, textContent });
      return;
    }

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
      if (update.entry.translations && update.entry.translations[currentLocale]) {
        translatedText = update.entry.translations[currentLocale];
      }
    }
  }

  function handleHMRUpdate(event: Event) {
    const customEvent = event as CustomEvent;
    const translations = customEvent.detail;
    // Find matching translation
    for (const key in translations) {
      if (translations[key].text === textContent) {
        translatedText = translations[key].translations[currentLocale] || textContent;
        break;
      }
    }
  }

  function handleLocaleChange() {
    if (textContent) {
      requestTranslation();
    }
  }
</script>

<span
  bind:this={containerRef}
  class="tsd-translation"
  class:loading={isLoading}
  class:translating={isLoading && textContent}
  title="{connectionInfo.isEnvoy
    ? 'Via Envoy Proxy'
    : 'Direct HTTP'} - {connectionInfo.environment}"
>
  {#if !textContent && children}
    <!-- Initial render: show children content -->
    {@render children()}
  {:else if isLoading && textContent}
    <!-- Loading: show original text with shimmer -->
    <span class="original-text">{textContent}</span>
  {:else if translatedText}
    <!-- Translated: show translated text -->
    <span class="translated-text">{translatedText}</span>
  {:else if children}
    <!-- Fallback: show children -->
    {@render children()}
  {:else}
    <!-- Empty fallback -->
    <span class="loading-text">...</span>
  {/if}
</span>

<style>
  .tsd-translation {
    display: inline-block;
    position: relative;
  }

  .tsd-translation.loading {
    opacity: 0.95;
  }

  /* Magic translation animation */
  .tsd-translation.translating {
    animation: shimmer 1.5s ease-in-out infinite;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 62, 0, 0.05) 20%,
      rgba(255, 62, 0, 0.1) 50%,
      rgba(255, 62, 0, 0.05) 80%,
      transparent 100%
    );
    background-size: 200% 100%;
    border-radius: 4px;
    padding: 0 4px;
    margin: 0 -4px;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }

  /* Smooth transition between original and translated text */
  .original-text,
  .translated-text {
    display: inline-block;
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .loading-text {
    color: #999;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.7;
    }
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