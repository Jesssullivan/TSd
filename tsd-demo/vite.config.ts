import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { tsdVitePlugin } from '@tummycrypt/tsd/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tsdVitePlugin({
			translationProvider: {
				type: 'libretranslate',
				apiKey: '1b62680e-9bf3-4988-bfc3-a332f98e6da3',
				apiUrl: process.env.VITE_LIBRETRANSLATE_URL || process.env.LIBRETRANSLATE_URL || (process.env.NODE_ENV === 'production' ? 'http://libretranslate:5000' : 'https://libretranslate.com'),
			},
			defaultLocale: 'en',
			supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
			envoy: {
				autoDiscover: true,
				endpoint: process.env.VITE_ENVOY_ENDPOINT || process.env.ENVOY_ENDPOINT,
				kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
				serviceName: process.env.K8S_SERVICE_NAME || 'tsd-service'
			}
		})
	]
});

