# TSd Envoy Integration Guide

TSd supports automatic discovery and integration with Envoy proxy for production deployments, especially in Kubernetes environments.

## Features

### Auto-Discovery

TSd automatically detects if it's running behind an Envoy proxy by checking:

- Kubernetes environment variables
- Common Envoy sidecar ports (15000, 15001)
- Envoy-specific HTTP headers
- Configured environment variables

### Dual Protocol Support

- **Development**: Uses HTTP/JSON for simple debugging
- **Production with Envoy**: Uses gRPC-Web for efficient binary communication

### Console Logging

The package provides detailed console logging to help you understand the translation flow:

```javascript
[TSd] 🚀 Using Envoy proxy at http://localhost:15000 (kubernetes environment)
[TSd] 📤 Request #1: Translating "Hello" from en to es
[TSd] ✅ Request #1 completed in 23.45ms via Envoy
[TSd] 📥 Translation: "Hello" → "Hola"
```

## Configuration

### Basic Configuration

```javascript
// vite.config.js
import { tsdVitePlugin } from '@tinyland/tsd/vite';

export default {
  plugins: [
    tsdVitePlugin({
      translationProvider: {
        type: 'libretranslate',
        apiKey: 'your-api-key',
      },
      envoy: {
        autoDiscover: true, // Enable auto-discovery
      },
    }),
  ],
};
```

### Advanced Configuration

```javascript
tsdVitePlugin({
  translationProvider: {
    type: 'libretranslate',
    apiKey: 'your-api-key',
  },
  envoy: {
    autoDiscover: true,
    endpoint: process.env.ENVOY_ENDPOINT, // Override auto-discovery
    kubernetesNamespace: 'my-namespace',
    serviceName: 'translation-service',
  },
});
```

## Environment Variables

TSd checks these environment variables for Envoy configuration:

- `ENVOY_HOST` - Envoy proxy hostname
- `ENVOY_PORT` - Envoy proxy port
- `ENVOY_ENDPOINT` - Full Envoy endpoint URL
- `ENVOY_PROXY_URL` - Alternative proxy URL
- `GRPC_WEB_PROXY_URL` - gRPC-Web specific proxy URL
- `KUBERNETES_SERVICE_HOST` - Indicates Kubernetes environment
- `K8S_NAMESPACE` - Kubernetes namespace
- `K8S_SERVICE_NAME` - Kubernetes service name

## Kubernetes Deployment

### With Envoy Sidecar (Recommended)

See `k8s/example-deployment.yaml` for a complete example with Envoy sidecar.

### With Istio Service Mesh

TSd automatically detects Istio's Envoy sidecar:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tsd-app
spec:
  ports:
    - port: 80
      name: http
    - port: 50051
      name: grpc
```

## Monitoring Translation Efficiency

Open your browser console to see:

- Which protocol is being used (Envoy gRPC vs HTTP/JSON)
- Request/response timing
- Cache hit/miss information
- Real-time update notifications

### Performance Indicators

- 🚀 **Envoy Proxy**: High-performance binary protocol
- 🌐 **HTTP/JSON**: Development-friendly text protocol
- ⚡ **Timing**: Each request shows millisecond precision
- 📊 **Request ID**: Track individual translations

## Troubleshooting

### Envoy Not Detected

1. Check environment variables are set correctly
2. Verify Envoy is running on expected ports
3. Check browser console for detection logs

### Connection Issues

1. Verify CORS configuration in Envoy
2. Check gRPC-Web filter is enabled
3. Ensure proper service discovery in Kubernetes

### Debug Mode

Enable detailed logging in your component:

```svelte
<script>
  // Console will show all translation operations
  window.__TSD_DEBUG__ = true;
</script>
```
