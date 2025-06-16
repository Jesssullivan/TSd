// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = async () => {
  // Redirect old route to new locale-based route
  throw redirect(301, '/en/tsd-demo');
};;null as any as PageServerLoad;