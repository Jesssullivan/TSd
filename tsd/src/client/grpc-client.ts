import { EnvoyDiscovery } from '../lib/envoy-discovery.js';

export interface GrpcClientConfig {
  host: string;
  port: number;
  envoy?: {
    autoDiscover?: boolean;
    endpoint?: string;
    kubernetesNamespace?: string;
    serviceName?: string;
  };
}

export class TsdGrpcClient {
  private baseUrl: string;
  private subscriptions: Map<string, (update: any) => void> = new Map();
  private eventSource: EventSource | null = null;
  private envoyDiscovery: EnvoyDiscovery;
  private requestCount = 0;
  private envoyConfig: any;

  constructor(config: GrpcClientConfig) {
    this.envoyDiscovery = EnvoyDiscovery.getInstance();
    this.envoyConfig = this.envoyDiscovery.getConfig();

    // Use discovered endpoint or fallback to origin
    if (this.envoyConfig.isEnvoy) {
      this.baseUrl = this.envoyConfig.endpoint;
      console.log(
        `[TSd] 🚀 Using Envoy proxy at ${this.baseUrl} (${this.envoyConfig.environment} environment)`
      );
    } else {
      this.baseUrl = `${window.location.origin}/grpc`;
      console.log(
        `[TSd] 🌐 Using HTTP/JSON at ${this.baseUrl} (${this.envoyConfig.environment} environment)`
      );
    }

    this.logConnectionInfo();
  }

  private logConnectionInfo(): void {
    console.group('[TSd] Connection Information');
    console.log('Protocol:', this.envoyConfig.protocol);
    console.log('Environment:', this.envoyConfig.environment);
    console.log('Envoy Detected:', this.envoyConfig.isEnvoy);
    console.log('Base URL:', this.baseUrl);
    console.groupEnd();
  }

  async translate(text: string, nativeLocale: string, targetLocale: string): Promise<string> {
    const requestId = ++this.requestCount;
    const startTime = performance.now();

    console.log(
      `[TSd] 📤 Request #${requestId}: Translating "${text}" from ${nativeLocale} to ${targetLocale}`
    );

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add gRPC-Web headers if using Envoy
      if (this.envoyConfig.isEnvoy) {
        headers['X-Grpc-Web'] = '1';
        headers['grpc-timeout'] = '10S';
      }

      const url = this.envoyConfig.isEnvoy
        ? `${this.baseUrl}/tsd.TranslationService/Translate`
        : `${this.baseUrl}/tsd.TranslationService/Translate`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          native_locale: nativeLocale,
          target_locale: targetLocale,
        }),
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      if (!response.ok) {
        console.error(
          `[TSd] ❌ Request #${requestId} failed: HTTP ${response.status} (${duration}ms)`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const translated = data.translated_text;

      console.log(
        `[TSd] ✅ Request #${requestId} completed in ${duration}ms via ${this.envoyConfig.isEnvoy ? 'Envoy' : 'HTTP'}`
      );
      console.log(`[TSd] 📥 Translation: "${text}" → "${translated}"`);

      return translated;
    } catch (error) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      console.error(`[TSd] ❌ Request #${requestId} error after ${duration}ms:`, error);
      throw error;
    }
  }

  async getTranslations(locale?: string): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/tsd.TranslationService/GetTranslations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Grpc-Web': '1',
        },
        body: JSON.stringify({ locale }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.translations || {};
    } catch (error) {
      console.error('[TSd gRPC Client] Get translations error:', error);
      throw error;
    }
  }

  subscribeToUpdates(callback: (update: any) => void, locales?: string[]): () => void {
    const id = Math.random().toString(36).substring(7);
    this.subscriptions.set(id, callback);

    console.log(
      `[TSd] 🔔 Setting up real-time updates via ${this.envoyConfig.isEnvoy ? 'Envoy gRPC streaming' : 'Server-Sent Events'}`
    );

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    // Create Server-Sent Events connection
    const url = new URL(`${this.baseUrl}/tsd.TranslationService/SubscribeTranslations`);
    if (locales) {
      url.searchParams.set('locales', locales.join(','));
    }

    this.eventSource = new EventSource(url.toString());

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          console.log(
            `[TSd] ✅ Real-time updates connected via ${this.envoyConfig.isEnvoy ? 'Envoy' : 'SSE'}`
          );
        } else {
          console.log('[TSd] 📨 Translation update received:', data.key);
          callback(data);
        }
      } catch (error) {
        console.error('[TSd] ❌ Error parsing update:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error(
        `[TSd] ❌ ${this.envoyConfig.isEnvoy ? 'Envoy streaming' : 'SSE'} error:`,
        error
      );
    };

    // Return unsubscribe function
    return () => {
      console.log('[TSd] 🔕 Unsubscribing from real-time updates');
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.subscriptions.delete(id);
    };
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).TsdGrpcClient = TsdGrpcClient;
}
