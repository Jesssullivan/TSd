import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Replace %tsd.lang% with the current locale
			const locale = event.params.locale || 'en';
			return html.replace(/%tsd\.lang%/g, locale);
		}
	});
	
	return response;
};