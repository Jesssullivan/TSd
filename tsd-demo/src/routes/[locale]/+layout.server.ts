import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

export const load: LayoutServerLoad = async ({ params }) => {
  const { locale } = params;
  
  // Validate locale
  if (!supportedLocales.includes(locale)) {
    // Redirect to English if locale is not supported
    throw redirect(302, '/en');
  }
  
  return {
    locale
  };
};