import * as server from '../entries/pages/_locale_/_layout.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_locale_/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/[locale]/+layout.server.ts";
export const imports = ["_app/immutable/nodes/2.DwwPtTol.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/CUK3pkoi.js","_app/immutable/chunks/BfUNpN1q.js","_app/immutable/chunks/DySfId5U.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/chunks/Cne7te_C.js","_app/immutable/chunks/C69954PU.js"];
export const stylesheets = ["_app/immutable/assets/Tsd.DV6CS4n7.css"];
export const fonts = [];
