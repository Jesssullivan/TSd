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
export declare class TsdGrpcClient {
    private baseUrl;
    private subscriptions;
    private eventSource;
    private envoyDiscovery;
    private requestCount;
    private envoyConfig;
    constructor(config: GrpcClientConfig);
    private logConnectionInfo;
    translate(text: string, nativeLocale: string, targetLocale: string): Promise<string>;
    getTranslations(locale?: string): Promise<Record<string, any>>;
    subscribeToUpdates(callback: (update: any) => void, locales?: string[]): () => void;
}
//# sourceMappingURL=grpc-client.d.ts.map