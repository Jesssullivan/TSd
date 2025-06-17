import { j as json } from './index2-DyoisQP2.js';

const POST = async ({ request }) => {
  const { text, native_locale, target_locale } = await request.json();
  const baseUrl = process.env.LIBRETRANSLATE_URL || (process.env.NODE_ENV === "production" ? "http://libretranslate:5000" : "https://libretranslate.com");
  const libretranslateUrl = `${baseUrl}/translate`;
  console.log(`[TSd API] Translating "${text}" from ${native_locale} to ${target_locale}`);
  console.log(`[TSd API] Using LibreTranslate at: ${libretranslateUrl}`);
  try {
    const response = await fetch(libretranslateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: native_locale,
        target: target_locale,
        format: "text",
        api_key: ""
      })
    });
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }
    const data = await response.json();
    return json({
      translated_text: data.translatedText,
      native_locale,
      target_locale
    });
  } catch (error) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return json({ error: errorMessage }, { status: 500 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-B_KQ_F3O.js.map
