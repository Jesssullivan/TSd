import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Redirect root path to /en/tsd-demo
	if (event.url.pathname === '/') {
		throw redirect(302, '/en/tsd-demo');
	}

	// Redirect /[locale]/ to /[locale]/tsd-demo
	const localeOnlyMatch = event.url.pathname.match(/^\/([a-z]{2})\/?$/);
	if (localeOnlyMatch) {
		const locale = localeOnlyMatch[1];
		throw redirect(302, `/${locale}/tsd-demo`);
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Replace %tsd.lang% with the current locale
			const locale = event.params.locale || 'en';
			return html.replace(/%tsd\.lang%/g, locale);
		}
	});

	return response;
};