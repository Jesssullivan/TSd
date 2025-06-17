var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const _EnvoyDiscovery = class _EnvoyDiscovery {
  constructor() {
    __publicField(this, "config");
    this.config = this.detectEnvironment();
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new _EnvoyDiscovery();
    }
    return this.instance;
  }
  detectEnvironment() {
    const isKubernetes = this.isRunningInKubernetes();
    if (isKubernetes) {
      const envoyEndpoint = this.discoverEnvoySidecar();
      if (envoyEndpoint) {
        console.log("[TSd] Detected Envoy sidecar in Kubernetes:", envoyEndpoint);
        return {
          endpoint: envoyEndpoint,
          isEnvoy: true,
          environment: "kubernetes",
          protocol: "grpc-web"
        };
      }
    }
    const standaloneEnvoy = this.discoverStandaloneEnvoy();
    if (standaloneEnvoy) {
      console.log("[TSd] Detected standalone Envoy proxy:", standaloneEnvoy);
      return {
        endpoint: standaloneEnvoy,
        isEnvoy: true,
        environment: "production",
        protocol: "grpc-web"
      };
    }
    console.log("[TSd] Running in development mode with HTTP/JSON");
    return {
      endpoint: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      isEnvoy: false,
      environment: "development",
      protocol: "http-json"
    };
  }
  isRunningInKubernetes() {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      return hostname.includes(".cluster.local") || hostname.includes(".svc") || this.hasKubernetesHeaders();
    } else {
      return !!(process.env["KUBERNETES_SERVICE_HOST"] || process.env["KUBERNETES_PORT"] || process.env["KUBERNETES_SERVICE_PORT"]);
    }
  }
  hasKubernetesHeaders() {
    return false;
  }
  discoverEnvoySidecar() {
    const envoyPorts = [
      15001,
      // Envoy admin port
      15e3,
      // Envoy proxy port
      8080,
      // Common Envoy HTTP port
      9901
      // Envoy admin interface
    ];
    if (typeof process !== "undefined") {
      const envoyHost = process.env["ENVOY_HOST"] || process.env["ENVOY_PROXY_HOST"];
      const envoyPort = process.env["ENVOY_PORT"] || process.env["ENVOY_PROXY_PORT"];
      if (envoyHost && envoyPort) {
        return `http://${envoyHost}:${envoyPort}`;
      }
    }
    if (typeof window !== "undefined") {
      const viaHeader = document.querySelector('meta[name="x-envoy-upstream-service-time"]');
      if (viaHeader) {
        return `${window.location.protocol}//${window.location.hostname}:15000`;
      }
    }
    return null;
  }
  discoverStandaloneEnvoy() {
    const commonEnvoyHosts = ["envoy", "envoy-proxy", "grpc-proxy", "api-gateway"];
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      for (const host of commonEnvoyHosts) {
        if (hostname.includes(host)) {
          return window.location.origin;
        }
      }
    }
    if (typeof process !== "undefined") {
      const grpcWebProxy = process.env["GRPC_WEB_PROXY_URL"] || process.env["ENVOY_PROXY_URL"];
      if (grpcWebProxy) {
        return grpcWebProxy;
      }
    }
    return null;
  }
  getConfig() {
    return this.config;
  }
  // Allow manual override for testing
  setConfig(config) {
    this.config = { ...this.config, ...config };
    console.log("[TSd] Envoy config updated:", this.config);
  }
};
__name(_EnvoyDiscovery, "EnvoyDiscovery");
__publicField(_EnvoyDiscovery, "instance");
let EnvoyDiscovery = _EnvoyDiscovery;
export {
  EnvoyDiscovery
};
//# sourceMappingURL=envoy-discovery.js.map
