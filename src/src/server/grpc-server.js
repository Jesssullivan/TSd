import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/translation.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const translationProto = grpc.loadPackageDefinition(packageDefinition).tsd;

// LibreTranslate client setup
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

async function translateText(text, source, target) {
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: source,
      target: target,
      format: 'text'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Translation failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.translatedText;
}

// Implement translation service
function translate(call, callback) {
  const { text, native_locale, target_locale } = call.request;
  
  console.log(`[gRPC] Translating "${text}" from ${native_locale} to ${target_locale}`);
  
  translateText(text, native_locale, target_locale)
    .then(translatedText => {
      console.log(`[gRPC] Translation complete: "${translatedText}"`);
      callback(null, {
        translated_text: translatedText,
        source_locale: native_locale,
        target_locale: target_locale
      });
    })
    .catch(error => {
      console.error('[gRPC] Translation error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    });
}

// Start server
const server = new grpc.Server();
server.addService(translationProto.TranslationService.service, {
  Translate: translate
});

const PORT = process.env.PORT || 50051;

// Health check HTTP server
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const HEALTH_PORT = process.env.HEALTH_PORT || 50052;
healthServer.listen(HEALTH_PORT, () => {
  console.log(`[gRPC] Health check server running on port ${HEALTH_PORT}`);
});

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('[gRPC] Failed to bind:', err);
    process.exit(1);
  }
  console.log(`[gRPC] Server running on port ${port}`);
  server.start();
});
