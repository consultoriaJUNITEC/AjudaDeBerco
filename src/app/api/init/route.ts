import { NextRequest } from 'next/server';
import { initDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await initDB();
    return createResponse({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return createErrorResponse('Failed to initialize database', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
