/**
 * Envoy auto-discovery for Kubernetes environments
 */
export interface EnvoyConfig {
    endpoint: string;
    isEnvoy: boolean;
    environment: 'development' | 'kubernetes' | 'production';
    protocol: 'grpc-web' | 'http-json';
}
export declare class EnvoyDiscovery {
    private static instance;
    private config;
    private constructor();
    static getInstance(): EnvoyDiscovery;
    private detectEnvironment;
    private isRunningInKubernetes;
    private hasKubernetesHeaders;
    private discoverEnvoySidecar;
    private discoverStandaloneEnvoy;
    getConfig(): EnvoyConfig;
    setConfig(config: Partial<EnvoyConfig>): void;
}
//# sourceMappingURL=envoy-discovery.d.ts.map