import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
  const acceptLanguage = request.headers.get('accept-language') || '';
  const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].split('-')[0]);
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
  const preferredLocale = languages.find(lang => supportedLocales.includes(lang)) || 'en';
  throw redirect(302, `/${preferredLocale}`);
};