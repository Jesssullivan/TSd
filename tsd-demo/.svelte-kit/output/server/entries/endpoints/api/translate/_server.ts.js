import { j as json } from "../../../../chunks/index2.js";
const POST = async ({ request }) => {
  const { text, from, to } = await request.json();
  try {
    const response = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: "text",
        api_key: ""
      })
    });
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }
    const data = await response.json();
    return json({ translated: data.translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
export {
  POST
};
