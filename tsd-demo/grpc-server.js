#!/usr/bin/env node

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fetch = require('node-fetch');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'proto/translation.proto');
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
const PORT = process.env.PORT || '50051';

console.log('Starting gRPC server...');
console.log('LibreTranslate URL:', LIBRETRANSLATE_URL);
console.log('gRPC Port:', PORT);
console.log('Proto path:', PROTO_PATH);

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition);

// Implementation of the Translate RPC
const translationService = {
  Translate: async (call, callback) => {
    const { text, native_locale, target_locale } = call.request;
    console.log(`[gRPC] Translate request: "${text}" from ${native_locale} to ${target_locale}`);
    
    try {
      const requestBody = {
        q: text,
        source: native_locale,
        target: target_locale,
        format: 'text'
      };
      
      console.log('[gRPC] Sending to LibreTranslate:', requestBody);
      
      const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[gRPC] LibreTranslate error:', response.status, error);
        throw new Error(`LibreTranslate error: ${response.status} - ${error}`);
      }
      
      const data = await response.json();
      console.log('[gRPC] LibreTranslate response:', data);
      
      const result = {
        key: `${text}_${native_locale}_${target_locale}`,
        text: text,
        native_locale: native_locale,
        target_locale: target_locale,
        translated_text: data.translatedText,
        timestamp: Date.now().toString(),
      };
      
      console.log('[gRPC] Sending response:', result);
      callback(null, result);
    } catch (error) {
      console.error('[gRPC] Translation error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },
  
  GetTranslations: async (call, callback) => {
    console.log('[gRPC] GetTranslations request');
    // For demo purposes, return empty translations
    callback(null, { translations: {} });
  },
  
  SubscribeTranslations: (call) => {
    console.log('[gRPC] SubscribeTranslations request');
    // Send initial connection message
    call.write({
      key: 'connected',
      action: 'connected',
    });
    
    // Keep the stream open
    call.on('cancelled', () => {
      console.log('[gRPC] Client disconnected from subscription');
    });
  },
};

// Create and start the server
const server = new grpc.Server();

// Check if the service exists in the proto
if (!proto.tsd || !proto.tsd.TranslationService || !proto.tsd.TranslationService.service) {
  console.error('TranslationService not found in proto file. Proto structure:', proto);
  process.exit(1);
}

server.addService(proto.tsd.TranslationService.service, translationService);

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Failed to bind server:', err);
    process.exit(1);
  }
  console.log(`[gRPC] Server listening on port ${port}`);
  console.log('[gRPC] Ready to handle translation requests');
});