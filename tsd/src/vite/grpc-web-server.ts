import express from 'express';
import cors from 'cors';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';
import type { Server } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createGrpcWebServer(viteServer: ViteDevServer, translationManager: any) {
  const app = express();

  // Configure CORS for gRPC-Web
  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: ['grpc-status', 'grpc-message', 'grpc-encoding', 'grpc-status-details-bin'],
      allowedHeaders: [
        'x-grpc-web',
        'grpc-timeout',
        'content-type',
        'x-user-agent',
        'grpc-encoding',
        'grpc-accept-encoding',
      ],
    })
  );

  app.use(express.json());

  // Load proto file
  const PROTO_PATH = path.join(__dirname, '../proto/translation.proto');

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition) as any;

  // Track subscribed clients for Server-Sent Events
  const subscribers = new Map<string, any>();

  // Implement gRPC-Web endpoints using REST/JSON

  // Single translation endpoint
  app.post('/tsd.TranslationService/Translate', async (req: any, res: any) => {
    const { text, native_locale, target_locale } = req.body;

    console.log('[TSd gRPC-Web] Translate request:', { text, native_locale, target_locale });

    try {
      const keyMonad = await translationManager.addTranslationRequest(text, native_locale);
      const key = await keyMonad.getOrElse('');
      
      const translatedMonad = await translationManager.getOrCreateTranslation(
        text,
        native_locale,
        target_locale
      );
      
      const translated = await translatedMonad.getOrElse(text);

      console.log('[TSd gRPC-Web] Translation response:', { key, translated });

      res.json({
        key,
        text,
        native_locale,
        target_locale,
        translated_text: translated,
        timestamp: Date.now().toString(),
      });

      // Notify subscribers
      broadcastUpdate(key);
    } catch (error: any) {
      console.error('[TSd gRPC-Web] Translation error:', error);
      res.status(500).json({
        code: 13, // INTERNAL
        message: error.message,
        details: error.stack,
      });
    }
  });

  // Get all translations endpoint
  app.post('/tsd.TranslationService/GetTranslations', async (req: any, res: any) => {
    const { locale } = req.body;

    try {
      const translations = await translationManager.getTranslations();

      // Convert to gRPC-Web format
      const formattedTranslations: Record<string, any> = {};
      for (const [key, entry] of Object.entries(translations)) {
        formattedTranslations[key] = {
          key,
          text: (entry as any).text,
          native_locale: (entry as any).nativeLocale,
          translations: (entry as any).translations || {},
        };
      }

      res.json({ translations: formattedTranslations });
    } catch (error: any) {
      res.status(500).json({
        code: 13, // INTERNAL
        message: error.message,
      });
    }
  });

  // Subscribe to updates using Server-Sent Events
  app.get('/tsd.TranslationService/SubscribeTranslations', (req: any, res: any) => {
    const id = Math.random().toString(36).substring(7);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write('data: {"connected": true}\n\n');

    subscribers.set(id, res);

    console.log('[TSd gRPC-Web] Client subscribed:', id);

    req.on('close', () => {
      console.log('[TSd gRPC-Web] Client unsubscribed:', id);
      subscribers.delete(id);
    });
  });

  // Broadcast updates to all subscribers
  async function broadcastUpdate(key: string) {
    const translations = await translationManager.getTranslations();
    const entry = translations[key];

    if (entry) {
      const update = {
        key,
        entry: {
          key,
          text: entry.text,
          native_locale: entry.nativeLocale,
          translations: entry.translations || {},
        },
        action: 'updated',
      };

      const message = `data: ${JSON.stringify(update)}\n\n`;

      subscribers.forEach((res, id) => {
        try {
          res.write(message);
        } catch (error) {
          console.error('[TSd gRPC-Web] Error broadcasting update:', error);
          subscribers.delete(id);
        }
      });
    }
  }

  // Mount the express app as middleware
  viteServer.middlewares.use('/grpc', app);

  console.log('[TSd gRPC-Web] Server initialized on /grpc/*');

  return {
    broadcast: broadcastUpdate,
  };
}
