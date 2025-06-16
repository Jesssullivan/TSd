export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.Dg1domrw.js",app:"_app/immutable/entry/app.DxmHvONt.js",imports:["_app/immutable/entry/start.Dg1domrw.js","_app/immutable/chunks/C69954PU.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/entry/app.DxmHvONt.js","_app/immutable/chunks/BckHep5H.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DKFbEgCw.js","_app/immutable/chunks/CUK3pkoi.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/vsKkyAZf.js","_app/immutable/chunks/CstVbTSV.js","_app/immutable/chunks/DySfId5U.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/api/translate/_server.ts.js'))
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
