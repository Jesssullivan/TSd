import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tsd-demo'
  });
};