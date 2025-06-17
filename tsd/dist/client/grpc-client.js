var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { EnvoyDiscovery } from "../lib/envoy-discovery.js";
const _TsdGrpcClient = class _TsdGrpcClient {
  constructor(config) {
    __publicField(this, "baseUrl");
    __publicField(this, "subscriptions", /* @__PURE__ */ new Map());
    __publicField(this, "eventSource", null);
    __publicField(this, "envoyDiscovery");
    __publicField(this, "requestCount", 0);
    __publicField(this, "envoyConfig");
    this.envoyDiscovery = EnvoyDiscovery.getInstance();
    if (typeof window !== "undefined" && window.__TSD_CONFIG__?.envoy?.endpoint) {
      const envoyEndpoint = window.__TSD_CONFIG__.envoy.endpoint;
      console.log(`[TSd] \u{1F3AF} Using configured Envoy endpoint: ${envoyEndpoint}`);
      this.envoyDiscovery.setConfig({
        endpoint: envoyEndpoint,
        isEnvoy: true,
        environment: "production",
        protocol: "grpc-web"
      });
    }
    this.envoyConfig = this.envoyDiscovery.getConfig();
    if (this.envoyConfig.isEnvoy) {
      this.baseUrl = this.envoyConfig.endpoint;
      console.log(
        `[TSd] \u{1F680} Using Envoy proxy at ${this.baseUrl} (${this.envoyConfig.environment} environment)`
      );
    } else {
      const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168.") || window.location.hostname.includes(".local");
      if (isDevelopment) {
        this.baseUrl = `${window.location.origin}/grpc`;
        console.log(
          `[TSd] \u{1F310} Using development gRPC server at ${this.baseUrl}`
        );
      } else {
        this.baseUrl = `${window.location.origin}/api`;
        console.log(
          `[TSd] \u{1F310} Using production API at ${this.baseUrl}`
        );
      }
    }
    this.logConnectionInfo();
  }
  logConnectionInfo() {
    console.group("[TSd] Connection Information");
    console.log("Protocol:", this.envoyConfig.protocol);
    console.log("Environment:", this.envoyConfig.environment);
    console.log("Envoy Detected:", this.envoyConfig.isEnvoy);
    console.log("Base URL:", this.baseUrl);
    console.groupEnd();
  }
  async translate(text, nativeLocale, targetLocale) {
    const requestId = ++this.requestCount;
    const startTime = performance.now();
    console.log(
      `[TSd] \u{1F4E4} Request #${requestId}: Translating "${text}" from ${nativeLocale} to ${targetLocale}`
    );
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.envoyConfig.isEnvoy) {
        headers["X-Grpc-Web"] = "1";
        headers["grpc-timeout"] = "10S";
      }
      let url;
      let requestBody;
      if (this.envoyConfig.isEnvoy || this.baseUrl.includes("/grpc")) {
        url = `${this.baseUrl}/tsd.TranslationService/Translate`;
        requestBody = {
          text,
          native_locale: nativeLocale,
          target_locale: targetLocale
        };
      } else {
        url = `${this.baseUrl}/translate`;
        requestBody = {
          text,
          from: nativeLocale,
          to: targetLocale
        };
      }
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      if (!response.ok) {
        console.error(
          `[TSd] \u274C Request #${requestId} failed: HTTP ${response.status} (${duration}ms)`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const translated = data.translated_text || data.translated || text;
      console.log(
        `[TSd] \u2705 Request #${requestId} completed in ${duration}ms via ${this.envoyConfig.isEnvoy ? "Envoy" : this.baseUrl.includes("/grpc") ? "gRPC" : "API"}`
      );
      console.log(`[TSd] \u{1F4E5} Translation: "${text}" \u2192 "${translated}"`);
      return translated;
    } catch (error) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      console.error(`[TSd] \u274C Request #${requestId} error after ${duration}ms:`, error);
      throw error;
    }
  }
  async getTranslations(locale) {
    try {
      const response = await fetch(`${this.baseUrl}/tsd.TranslationService/GetTranslations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Grpc-Web": "1"
        },
        body: JSON.stringify({ locale })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.translations || {};
    } catch (error) {
      console.error("[TSd gRPC Client] Get translations error:", error);
      throw error;
    }
  }
  subscribeToUpdates(callback, locales) {
    const id = Math.random().toString(36).substring(7);
    this.subscriptions.set(id, callback);
    console.log(
      `[TSd] \u{1F514} Setting up real-time updates via ${this.envoyConfig.isEnvoy ? "Envoy gRPC streaming" : "Server-Sent Events"}`
    );
    if (this.eventSource) {
      this.eventSource.close();
    }
    let sseUrl;
    if (this.envoyConfig.isEnvoy || this.baseUrl.includes("/grpc")) {
      sseUrl = `${this.baseUrl}/tsd.TranslationService/SubscribeTranslations`;
    } else {
      console.log("[TSd] SSE not available in production mode, skipping real-time updates");
      return () => {
        this.subscriptions.delete(id);
      };
    }
    const url = new URL(sseUrl);
    if (locales) {
      url.searchParams.set("locales", locales.join(","));
    }
    this.eventSource = new EventSource(url.toString());
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          console.log(
            `[TSd] \u2705 Real-time updates connected via ${this.envoyConfig.isEnvoy ? "Envoy" : "SSE"}`
          );
        } else {
          console.log("[TSd] \u{1F4E8} Translation update received:", data.key);
          callback(data);
        }
      } catch (error) {
        console.error("[TSd] \u274C Error parsing update:", error);
      }
    };
    this.eventSource.onerror = (error) => {
      console.error(
        `[TSd] \u274C ${this.envoyConfig.isEnvoy ? "Envoy streaming" : "SSE"} error:`,
        error
      );
    };
    return () => {
      console.log("[TSd] \u{1F515} Unsubscribing from real-time updates");
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.subscriptions.delete(id);
    };
  }
};
__name(_TsdGrpcClient, "TsdGrpcClient");
let TsdGrpcClient = _TsdGrpcClient;
if (typeof window !== "undefined") {
  window.TsdGrpcClient = TsdGrpcClient;
}
export {
  TsdGrpcClient
};
//# sourceMappingURL=grpc-client.js.map
