import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { text, native_locale, target_locale } = await request.json();
	
	// Use configured LibreTranslate URL with environment variable fallback
	const baseUrl = import.meta.env.VITE_LIBRETRANSLATE_URL || 
		process.env.LIBRETRANSLATE_URL || 
		(process.env.NODE_ENV === 'production' 
			? 'http://libretranslate:5000'
			: 'https://libretranslate.com');
	
	const libretranslateUrl = `${baseUrl}/translate`;
	
	console.log(`[TSd API] Translating "${text}" from ${native_locale} to ${target_locale}`);
	console.log(`[TSd API] Using LibreTranslate at: ${libretranslateUrl}`);
	
	try {
		const response = await fetch(libretranslateUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				q: text,
				source: native_locale,
				target: target_locale,
				format: 'text',
				api_key: '',
			}),
		});
		
		if (!response.ok) {
			throw new Error(`Translation API error: ${response.statusText}`);
		}
		
		const data = await response.json();
		return json({ 
			translated_text: data.translatedText,
			native_locale: native_locale,
			target_locale: target_locale
		});
	} catch (error) {
		console.error('Translation error:', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return json({error: errorMessage}, {status: 500});
	}
};