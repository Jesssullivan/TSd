import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { text, from, to } = await request.json();
	
	try {
		const response = await fetch('https://libretranslate.com/translate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				q: text,
				source: from,
				target: to,
				format: 'text',
				api_key: '1b62680e-9bf3-4988-bfc3-a332f98e6da3',
			}),
		});
		
		if (!response.ok) {
			throw new Error(`Translation API error: ${response.statusText}`);
		}
		
		const data = await response.json();
		return json({ translated: data.translatedText });
	} catch (error) {
		console.error('Translation error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};