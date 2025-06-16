import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { tsdVitePlugin } from '@tummycrypt/tsd/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tsdVitePlugin({
			translationProvider: {
				type: 'libretranslate',
				apiKey: '',
			},
			defaultLocale: 'en',
			supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
			envoy: {
				autoDiscover: true,
				endpoint: process.env.ENVOY_ENDPOINT,
				kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
				serviceName: process.env.K8S_SERVICE_NAME || 'tsd-service'
			}
		})
	]
});

