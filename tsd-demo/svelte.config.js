import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Production configuration
			out: 'build',
			precompress: false,
			envPrefix: '',
		})
	}
};

export default config;