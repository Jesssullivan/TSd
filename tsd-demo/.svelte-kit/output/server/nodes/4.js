import * as server from '../entries/pages/_locale_/tsd-demo/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_locale_/tsd-demo/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/[locale]/tsd-demo/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.DRXmWr1d.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/DKFbEgCw.js","_app/immutable/chunks/CUK3pkoi.js","_app/immutable/chunks/CstVbTSV.js","_app/immutable/chunks/BfUNpN1q.js","_app/immutable/chunks/DySfId5U.js","_app/immutable/chunks/BgcUizg5.js","_app/immutable/chunks/Cne7te_C.js","_app/immutable/chunks/C69954PU.js"];
export const stylesheets = ["_app/immutable/assets/Tsd.DV6CS4n7.css","_app/immutable/assets/4.BCAo7bN7.css"];
export const fonts = [];
