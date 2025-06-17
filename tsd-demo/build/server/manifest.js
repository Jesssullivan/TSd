const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".gitkeep","favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.DUYI4pdc.js",app:"_app/immutable/entry/app.Db-d9ROd.js",imports:["_app/immutable/entry/start.DUYI4pdc.js","_app/immutable/chunks/CVz61ZC1.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/entry/app.Db-d9ROd.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DKFbEgCw.js","_app/immutable/chunks/CUK3pkoi.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/chunks/CstVbTSV.js","_app/immutable/chunks/DySfId5U.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-C_3d7FwM.js')),
			__memo(() => import('./chunks/1-C75vMSMM.js')),
			__memo(() => import('./chunks/2-DtkCjP2f.js')),
			__memo(() => import('./chunks/3-C18xfzMC.js')),
			__memo(() => import('./chunks/4-f10n2Non.js')),
			__memo(() => import('./chunks/5-ZSaqTIyE.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/translate",
				pattern: /^\/api\/translate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B_KQ_F3O.js'))
			},
			{
				id: "/health",
				pattern: /^\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-5mOVyo8X.js'))
			},
			{
				id: "/tsd-demo",
				pattern: /^\/tsd-demo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/[locale]/tsd-demo",
				pattern: /^\/([^/]+?)\/tsd-demo\/?$/,
				params: [{"name":"locale","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
