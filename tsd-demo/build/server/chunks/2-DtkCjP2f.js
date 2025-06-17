import { r as redirect } from './index2-DyoisQP2.js';

const supportedLocales = ["en", "es", "fr", "de", "ja", "zh"];
const load = async ({ params }) => {
  const { locale } = params;
  if (!supportedLocales.includes(locale)) {
    throw redirect(302, "/en");
  }
  return {
    locale
  };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-4pncKHc8.js')).default;
const server_id = "src/routes/[locale]/+layout.server.ts";
const imports = ["_app/immutable/nodes/2.BTS8uoRf.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/CUK3pkoi.js","_app/immutable/chunks/BfUNpN1q.js","_app/immutable/chunks/DySfId5U.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/chunks/D-eAupRb.js","_app/immutable/chunks/CVz61ZC1.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=2-DtkCjP2f.js.map
