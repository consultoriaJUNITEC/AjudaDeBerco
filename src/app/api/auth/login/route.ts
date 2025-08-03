import { NextRequest } from 'next/server';
import { generateToken, verifyPasswordDirectly } from '@/lib/auth';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { LoginRequest, LoginResponse } from '@/types/backend/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    if (!body.password) {
      return createErrorResponse('Password is required', 400);
    }

    const isValid = verifyPasswordDirectly(body.password);
    
    if (!isValid) {
      return createErrorResponse('Invalid password', 403);
    }

    const token = generateToken();
    const expiresAt = Math.floor(Date.now() / 1000) + (8 * 60 * 60); // 8 hours

    const response: LoginResponse = {
      token,
      expires_at: expiresAt,
    };

    return createResponse(response);
  } catch (error) {
    console.error('Login error:', error);
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
