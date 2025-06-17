var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const _LibreTranslateClient = class _LibreTranslateClient {
  constructor(provider) {
    this.provider = provider;
    __publicField(this, "cache", /* @__PURE__ */ new Map());
  }
  async translate(text, from, to) {
    const cacheKey = `${text}:${from}:${to}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    let translated;
    try {
      switch (this.provider.type) {
        case "libretranslate":
          translated = await this.translateWithLibreTranslate(text, from, to);
          break;
        case "google":
          translated = await this.translateWithGoogle(text, from, to);
          break;
        case "custom":
          if (!this.provider.customTranslate) {
            throw new Error("Custom translate function not provided");
          }
          translated = await this.provider.customTranslate(text, from, to);
          break;
        default:
          throw new Error(`Unknown translation provider: ${this.provider.type}`);
      }
      this.cache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.error(`Translation error: ${error}`);
      return text;
    }
  }
  async translateWithLibreTranslate(text, from, to) {
    const endpoint = this.provider.endpoint || "https://libretranslate.com/translate";
    console.log("[LibreTranslate] Translating:", { text, from, to, endpoint });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: "text",
        api_key: this.provider.apiKey
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LibreTranslate] API error:", response.status, errorText);
      throw new Error(
        `LibreTranslate API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
    const data = await response.json();
    console.log("[LibreTranslate] Translation result:", data);
    return data.translatedText;
  }
  async translateWithGoogle(text, from, to) {
    throw new Error("Google Translate not implemented yet");
  }
};
__name(_LibreTranslateClient, "LibreTranslateClient");
let LibreTranslateClient = _LibreTranslateClient;
export {
  LibreTranslateClient
};
//# sourceMappingURL=libretranslate-client.js.map
