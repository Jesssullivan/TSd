var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import express from "express";
import cors from "cors";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function createGrpcWebServer(viteServer, translationManager) {
  const app = express();
  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: ["grpc-status", "grpc-message", "grpc-encoding", "grpc-status-details-bin"],
      allowedHeaders: [
        "x-grpc-web",
        "grpc-timeout",
        "content-type",
        "x-user-agent",
        "grpc-encoding",
        "grpc-accept-encoding"
      ]
    })
  );
  app.use(express.json());
  const PROTO_PATH = path.join(__dirname, "../proto/translation.proto");
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  const proto = grpc.loadPackageDefinition(packageDefinition);
  const subscribers = /* @__PURE__ */ new Map();
  app.post("/tsd.TranslationService/Translate", async (req, res) => {
    const { text, native_locale, target_locale } = req.body;
    console.log("[TSd gRPC-Web] Translate request:", { text, native_locale, target_locale });
    try {
      const keyMonad = await translationManager.addTranslationRequest(text, native_locale);
      const key = await keyMonad.getOrElse("");
      const translatedMonad = await translationManager.getOrCreateTranslation(
        text,
        native_locale,
        target_locale
      );
      const translated = await translatedMonad.getOrElse(text);
      console.log("[TSd gRPC-Web] Translation response:", { key, translated });
      res.json({
        key,
        text,
        native_locale,
        target_locale,
        translated_text: translated,
        timestamp: Date.now().toString()
      });
      broadcastUpdate(key);
    } catch (error) {
      console.error("[TSd gRPC-Web] Translation error:", error);
      res.status(500).json({
        code: 13,
        // INTERNAL
        message: error.message,
        details: error.stack
      });
    }
  });
  app.post("/tsd.TranslationService/GetTranslations", async (req, res) => {
    const { locale } = req.body;
    try {
      const translations = await translationManager.getTranslations();
      const formattedTranslations = {};
      for (const [key, entry] of Object.entries(translations)) {
        formattedTranslations[key] = {
          key,
          text: entry.text,
          native_locale: entry.nativeLocale,
          translations: entry.translations || {}
        };
      }
      res.json({ translations: formattedTranslations });
    } catch (error) {
      res.status(500).json({
        code: 13,
        // INTERNAL
        message: error.message
      });
    }
  });
  app.get("/tsd.TranslationService/SubscribeTranslations", (req, res) => {
    const id = Math.random().toString(36).substring(7);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.write('data: {"connected": true}\n\n');
    subscribers.set(id, res);
    console.log("[TSd gRPC-Web] Client subscribed:", id);
    req.on("close", () => {
      console.log("[TSd gRPC-Web] Client unsubscribed:", id);
      subscribers.delete(id);
    });
  });
  async function broadcastUpdate(key) {
    const translations = await translationManager.getTranslations();
    const entry = translations[key];
    if (entry) {
      const update = {
        key,
        entry: {
          key,
          text: entry.text,
          native_locale: entry.nativeLocale,
          translations: entry.translations || {}
        },
        action: "updated"
      };
      const message = `data: ${JSON.stringify(update)}

`;
      subscribers.forEach((res, id) => {
        try {
          res.write(message);
        } catch (error) {
          console.error("[TSd gRPC-Web] Error broadcasting update:", error);
          subscribers.delete(id);
        }
      });
    }
  }
  __name(broadcastUpdate, "broadcastUpdate");
  viteServer.middlewares.use("/grpc", app);
  console.log("[TSd gRPC-Web] Server initialized on /grpc/*");
  return {
    broadcast: broadcastUpdate
  };
}
__name(createGrpcWebServer, "createGrpcWebServer");
export {
  createGrpcWebServer
};
//# sourceMappingURL=grpc-web-server.js.map
