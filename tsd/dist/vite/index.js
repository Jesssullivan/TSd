var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { createTranslationManager } from "./translation-manager.js";
import { createGrpcWebServer } from "./grpc-web-server.js";
import { transformHtml } from "./html-transformer.js";
import * as path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function tsdVitePlugin(config) {
  console.log("[TSd] Initializing plugin with config:", config);
  let server;
  let translationManager;
  let grpcServer;
  const defaultConfig = {
    defaultLocale: "en",
    supportedLocales: ["en", "es", "fr", "de", "ja", "zh"],
    cacheDir: ".tsd-cache",
    enableHMR: true
  };
  const finalConfig = { ...defaultConfig, ...config };
  return {
    name: "vite-plugin-tsd",
    enforce: "pre",
    async buildStart() {
      try {
        const cacheDir = path.resolve(process.cwd(), finalConfig.cacheDir);
        await mkdir(cacheDir, { recursive: true });
        translationManager = createTranslationManager(finalConfig);
        await translationManager.loadCache();
      } catch (error) {
        console.error("[TSd] Error in buildStart:", error);
      }
    },
    async configureServer(_server) {
      server = _server;
      try {
        if (!translationManager) {
          console.log("[TSd] Translation manager not initialized, creating now");
          translationManager = createTranslationManager(finalConfig);
          await translationManager.loadCache();
        }
        grpcServer = createGrpcWebServer(server, translationManager);
        server.middlewares.use(async (req, res, next) => {
          if (req.url === "/__tsd/runtime.js") {
            res.setHeader("Content-Type", "application/javascript");
            res.end(await generateRuntimeScript(finalConfig));
            return;
          }
          if (req.url === "/__tsd/grpc-client.js") {
            res.setHeader("Content-Type", "application/javascript");
            res.end(await generateGrpcClientBundle());
            return;
          }
          if (req.url === "/__tsd/translations.json") {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(await translationManager.getTranslations()));
            return;
          }
          next();
        });
      } catch (error) {
        console.error("[TSd] Error in configureServer:", error);
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        console.log("[TSd] Transforming HTML for:", ctx.path);
        const transformed = transformHtml(html, finalConfig);
        console.log(
          "[TSd] HTML transformed, runtime injected:",
          transformed.includes("__tsd/runtime.js")
        );
        return transformed;
      }
    },
    async handleHotUpdate({ file, server: server2 }) {
      if (finalConfig.enableHMR && file.endsWith(".svelte")) {
        const translations = await translationManager.getTranslations();
        server2.ws.send({
          type: "custom",
          event: "tsd:translations-updated",
          data: translations
        });
      }
    }
  };
}
__name(tsdVitePlugin, "tsdVitePlugin");
async function generateGrpcClientBundle() {
  return `
    class EnvoyDiscovery {
      static instance;
      
      constructor() {
        this.config = this.detectEnvironment();
      }
      
      static getInstance() {
        if (!this.instance) {
          this.instance = new EnvoyDiscovery();
        }
        return this.instance;
      }
      
      detectEnvironment() {
        const isKubernetes = window.location.hostname.includes('.cluster.local') || 
                            window.location.hostname.includes('.svc');
        
        if (isKubernetes) {
          console.log('[TSd] Detected Kubernetes environment');
          return {
            endpoint: window.location.origin,
            isEnvoy: true,
            environment: 'kubernetes',
            protocol: 'grpc-web'
          };
        }
        
        console.log('[TSd] Running in development mode');
        return {
          endpoint: window.location.origin,
          isEnvoy: false,
          environment: 'development',
          protocol: 'http-json'
        };
      }
      
      getConfig() {
        return this.config;
      }
    }
    
    export class TsdGrpcClient {
      constructor(config) {
        this.requestCount = 0;
        this.subscriptions = new Map();
        this.eventSource = null;
        
        this.envoyDiscovery = EnvoyDiscovery.getInstance();
        this.envoyConfig = this.envoyDiscovery.getConfig();
        
        if (this.envoyConfig.isEnvoy) {
          this.baseUrl = this.envoyConfig.endpoint;
          console.log(\`[TSd] \u{1F680} Using Envoy proxy at \${this.baseUrl} (\${this.envoyConfig.environment} environment)\`);
        } else {
          this.baseUrl = \`\${window.location.origin}/grpc\`;
          console.log(\`[TSd] \u{1F310} Using HTTP/JSON at \${this.baseUrl} (\${this.envoyConfig.environment} environment)\`);
        }
        
        console.group('[TSd] Connection Information');
        console.log('Protocol:', this.envoyConfig.protocol);
        console.log('Environment:', this.envoyConfig.environment);
        console.log('Envoy Detected:', this.envoyConfig.isEnvoy);
        console.log('Base URL:', this.baseUrl);
        console.groupEnd();
      }
      
      async translate(text, nativeLocale, targetLocale) {
        const requestId = ++this.requestCount;
        const startTime = performance.now();
        
        console.log(\`[TSd] \u{1F4E4} Request #\${requestId}: Translating "\${text}" from \${nativeLocale} to \${targetLocale}\`);
        
        try {
          const headers = {
            'Content-Type': 'application/json',
          };
          
          if (this.envoyConfig.isEnvoy) {
            headers['X-Grpc-Web'] = '1';
            headers['grpc-timeout'] = '10S';
          }
          
          const response = await fetch(\`\${this.baseUrl}/tsd.TranslationService/Translate\`, {
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
            console.error(\`[TSd] \u274C Request #\${requestId} failed: HTTP \${response.status} (\${duration}ms)\`);
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }
          
          const data = await response.json();
          const translated = data.translated_text;
          
          console.log(\`[TSd] \u2705 Request #\${requestId} completed in \${duration}ms via \${this.envoyConfig.isEnvoy ? 'Envoy' : 'HTTP'}\`);
          console.log(\`[TSd] \u{1F4E5} Translation: "\${text}" \u2192 "\${translated}"\`);
          
          return translated;
        } catch (error) {
          const endTime = performance.now();
          const duration = (endTime - startTime).toFixed(2);
          console.error(\`[TSd] \u274C Request #\${requestId} error after \${duration}ms:\`, error);
          throw error;
        }
      }
      
      subscribeToUpdates(callback, locales) {
        const id = Math.random().toString(36).substring(7);
        this.subscriptions.set(id, callback);
        
        console.log(\`[TSd] \u{1F514} Setting up real-time updates via \${this.envoyConfig.isEnvoy ? 'Envoy gRPC streaming' : 'Server-Sent Events'}\`);
        
        if (this.eventSource) {
          this.eventSource.close();
        }
        
        const url = new URL(\`\${this.baseUrl}/tsd.TranslationService/SubscribeTranslations\`);
        if (locales) {
          url.searchParams.set('locales', locales.join(','));
        }
        
        this.eventSource = new EventSource(url.toString());
        
        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.connected) {
              console.log(\`[TSd] \u2705 Real-time updates connected via \${this.envoyConfig.isEnvoy ? 'Envoy' : 'SSE'}\`);
            } else {
              console.log('[TSd] \u{1F4E8} Translation update received:', data.key);
              callback(data);
            }
          } catch (error) {
            console.error('[TSd] \u274C Error parsing update:', error);
          }
        };
        
        this.eventSource.onerror = (error) => {
          console.error(\`[TSd] \u274C \${this.envoyConfig.isEnvoy ? 'Envoy streaming' : 'SSE'} error:\`, error);
        };
        
        return () => {
          console.log('[TSd] \u{1F515} Unsubscribing from real-time updates');
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }
          this.subscriptions.delete(id);
        };
      }
    }
  `;
}
__name(generateGrpcClientBundle, "generateGrpcClientBundle");
async function generateRuntimeScript(config) {
  return `
    console.log('[TSd Runtime] Initializing...');
    
    window.__TSD_CONFIG__ = ${JSON.stringify({
    defaultLocale: config.defaultLocale,
    supportedLocales: config.supportedLocales,
    envoy: config.envoy || {}
  })};
    
    console.log('[TSd Runtime] Config set:', window.__TSD_CONFIG__);

    // Initialize gRPC-Web client
    import('/__tsd/grpc-client.js').then(({ TsdGrpcClient }) => {
      console.log('[TSd Runtime] gRPC client loaded, creating connection...');
      
      window.__TSD_GRPC_CLIENT__ = new TsdGrpcClient({
        host: window.location.hostname,
        port: 50051,
        envoy: window.__TSD_CONFIG__.envoy,
      });
      
      // Subscribe to translation updates
      window.__TSD_GRPC_CLIENT__.subscribeToUpdates((update) => {
        window.dispatchEvent(new CustomEvent('tsd:translation-update', { detail: update }));
      });
      
      console.log('[TSd Runtime] gRPC client initialized');
    }).catch(error => {
      console.error('[TSd Runtime] Failed to load gRPC client:', error);
    });

    // Listen for HMR updates
    if (import.meta.hot) {
      import.meta.hot.on('tsd:translations-updated', (data) => {
        window.dispatchEvent(new CustomEvent('tsd:translations-updated', { detail: data }));
      });
    }
  `;
}
__name(generateRuntimeScript, "generateRuntimeScript");
export {
  tsdVitePlugin
};
//# sourceMappingURL=index.js.map
