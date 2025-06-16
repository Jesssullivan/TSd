/**
 * Envoy auto-discovery for Kubernetes environments
 */

export interface EnvoyConfig {
  endpoint: string;
  isEnvoy: boolean;
  environment: 'development' | 'kubernetes' | 'production';
  protocol: 'grpc-web' | 'http-json';
}

export class EnvoyDiscovery {
  private static instance: EnvoyDiscovery;
  private config: EnvoyConfig;

  private constructor() {
    this.config = this.detectEnvironment();
  }

  static getInstance(): EnvoyDiscovery {
    if (!this.instance) {
      this.instance = new EnvoyDiscovery();
    }
    return this.instance;
  }

  private detectEnvironment(): EnvoyConfig {
    // Check for Kubernetes environment variables
    const isKubernetes = this.isRunningInKubernetes();

    if (isKubernetes) {
      // In Kubernetes, check for Envoy sidecar
      const envoyEndpoint = this.discoverEnvoySidecar();
      if (envoyEndpoint) {
        console.log('[TSd] Detected Envoy sidecar in Kubernetes:', envoyEndpoint);
        return {
          endpoint: envoyEndpoint,
          isEnvoy: true,
          environment: 'kubernetes',
          protocol: 'grpc-web',
        };
      }
    }

    // Check for standalone Envoy proxy
    const standaloneEnvoy = this.discoverStandaloneEnvoy();
    if (standaloneEnvoy) {
      console.log('[TSd] Detected standalone Envoy proxy:', standaloneEnvoy);
      return {
        endpoint: standaloneEnvoy,
        isEnvoy: true,
        environment: 'production',
        protocol: 'grpc-web',
      };
    }

    // Default to development mode with HTTP/JSON
    console.log('[TSd] Running in development mode with HTTP/JSON');
    return {
      endpoint: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      isEnvoy: false,
      environment: 'development',
      protocol: 'http-json',
    };
  }

  private isRunningInKubernetes(): boolean {
    if (typeof window !== 'undefined') {
      // Client-side detection
      // Check for common Kubernetes ingress headers or patterns
      const hostname = window.location.hostname;
      return (
        hostname.includes('.cluster.local') ||
        hostname.includes('.svc') ||
        this.hasKubernetesHeaders()
      );
    } else {
      // Server-side detection
      return !!(
        process.env['KUBERNETES_SERVICE_HOST'] ||
        process.env['KUBERNETES_PORT'] ||
        process.env['KUBERNETES_SERVICE_PORT']
      );
    }
  }

  private hasKubernetesHeaders(): boolean {
    // Check if we have Kubernetes-specific headers in the response
    // This would be set by the ingress controller
    return false; // Will be populated from server response headers
  }

  private discoverEnvoySidecar(): string | null {
    // In Kubernetes with Envoy sidecar (e.g., Istio), the sidecar intercepts traffic
    // on localhost with a specific port
    const envoyPorts = [
      15001, // Envoy admin port
      15000, // Envoy proxy port
      8080, // Common Envoy HTTP port
      9901, // Envoy admin interface
    ];

    // Check environment variables first
    if (typeof process !== 'undefined') {
      const envoyHost = process.env['ENVOY_HOST'] || process.env['ENVOY_PROXY_HOST'];
      const envoyPort = process.env['ENVOY_PORT'] || process.env['ENVOY_PROXY_PORT'];

      if (envoyHost && envoyPort) {
        return `http://${envoyHost}:${envoyPort}`;
      }
    }

    // In browser, check for common sidecar patterns
    if (typeof window !== 'undefined') {
      // Check if we're being proxied through Envoy by looking at headers
      const viaHeader = document.querySelector('meta[name="x-envoy-upstream-service-time"]');
      if (viaHeader) {
        return `${window.location.protocol}//${window.location.hostname}:15000`;
      }
    }

    return null;
  }

  private discoverStandaloneEnvoy(): string | null {
    // Check for standalone Envoy proxy
    const commonEnvoyHosts = ['envoy', 'envoy-proxy', 'grpc-proxy', 'api-gateway'];

    if (typeof window !== 'undefined') {
      // In browser, check if current host matches Envoy patterns
      const hostname = window.location.hostname;
      for (const host of commonEnvoyHosts) {
        if (hostname.includes(host)) {
          return window.location.origin;
        }
      }
    }

    // Check environment variables
    if (typeof process !== 'undefined') {
      const grpcWebProxy = process.env['GRPC_WEB_PROXY_URL'] || process.env['ENVOY_PROXY_URL'];
      if (grpcWebProxy) {
        return grpcWebProxy;
      }
    }

    return null;
  }

  getConfig(): EnvoyConfig {
    return this.config;
  }

  // Allow manual override for testing
  setConfig(config: Partial<EnvoyConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[TSd] Envoy config updated:', this.config);
  }
}
