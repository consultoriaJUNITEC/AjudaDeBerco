import { createResponse } from '@/lib/utils';

export async function GET() {
  return createResponse({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AjudaDeBerco API'
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
