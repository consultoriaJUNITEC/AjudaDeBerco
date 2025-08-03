import { NextRequest } from 'next/server';
import { verifyToken, verifyPasswordDirectly } from '@/lib/auth';
import { createResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.password) {
      return createErrorResponse('Password is required', 400);
    }

    // First try direct password verification
    const isValidDirect = verifyPasswordDirectly(body.password);
    
    if (isValidDirect) {
      return createResponse({ valid: true });
    }

    // Then try JWT token verification
    const tokenClaims = verifyToken(body.password);
    
    if (tokenClaims) {
      return createResponse({ valid: true });
    }

    return createResponse({ valid: false });
  } catch (error) {
    console.error('Verify error:', error);
    return createErrorResponse('Internal server error', 500);
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
