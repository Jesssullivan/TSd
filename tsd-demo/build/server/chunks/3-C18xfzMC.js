import { r as redirect } from './index2-DyoisQP2.js';

const load = async ({ request }) => {
  const acceptLanguage = request.headers.get("accept-language") || "";
  const languages = acceptLanguage.split(",").map((lang) => lang.split(";")[0].split("-")[0]);
  const supportedLocales = ["en", "es", "fr", "de", "ja", "zh"];
  const preferredLocale = languages.find((lang) => supportedLocales.includes(lang)) || "en";
  throw redirect(302, `/${preferredLocale}`);
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CipUMQ2V.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/3.0VPOqv_P.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/CUK3pkoi.js","_app/immutable/chunks/BckHep5H.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=3-C18xfzMC.js.map
