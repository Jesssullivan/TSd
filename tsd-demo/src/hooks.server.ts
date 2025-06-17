import type {Handle} from '@sveltejs/kit';
import {redirect} from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/') {
		throw redirect(302, '/en/tsd-demo');
	}

	const localeOnlyMatch = event.url.pathname.match(/^\/([a-z]{2})\/?$/);
	if (localeOnlyMatch) {
		const locale = localeOnlyMatch[1];
		throw redirect(302, `/${locale}/tsd-demo`);
	}

	return resolve(event, {
		transformPageChunk: ({html}) => {
			// Replace %tsd.lang% with the current locale
			const locale = event.params.locale || 'en';
			let modifiedHtml = html.replace(/%tsd\.lang%/g, locale);
			
			// In production, inject Envoy configuration
			if (process.env.NODE_ENV === 'production' && process.env.VITE_ENVOY_ENDPOINT) {
				const configScript = `<script>window.__TSD_CONFIG__ = { envoy: { endpoint: "${process.env.VITE_ENVOY_ENDPOINT}" } };</script>`;
				modifiedHtml = modifiedHtml.replace('</head>', `${configScript}</head>`);
			}
			
			return modifiedHtml;
		}
	});
};