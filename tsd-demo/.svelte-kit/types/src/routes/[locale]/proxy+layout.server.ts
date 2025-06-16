// @ts-nocheck
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

export const load = async ({ params }: Parameters<LayoutServerLoad>[0]) => {
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