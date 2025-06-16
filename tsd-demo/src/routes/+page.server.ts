import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
  // Get browser's preferred language
  const acceptLanguage = request.headers.get('accept-language') || '';
  const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].split('-')[0]);
  
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
  
  // Find first supported locale from browser preferences
  const preferredLocale = languages.find(lang => supportedLocales.includes(lang)) || 'en';
  
  // Redirect to the preferred locale
  throw redirect(302, `/${preferredLocale}`);
};