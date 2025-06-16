import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { tsdVitePlugin } from '@tinyland/tsd/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tsdVitePlugin({
			translationProvider: {
				type: 'libretranslate',
				apiKey: '1b62680e-9bf3-4988-bfc3-a332f98e6da3',
			},
			defaultLocale: 'en',
			supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
			envoy: {
				autoDiscover: true,
				// Override with environment variables if needed
				endpoint: process.env.ENVOY_ENDPOINT,
				kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
				serviceName: process.env.K8S_SERVICE_NAME || 'tsd-service'
			}
		})
	]
});
