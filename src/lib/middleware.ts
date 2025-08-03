import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createErrorResponse } from '@/lib/utils';

export function withAuth(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse('Authentication required', 401);
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix
      const claims = verifyToken(token);

      if (!claims) {
        return createErrorResponse('Invalid token', 401);
      }

      // Add user info to request (if needed)
      // (request as any).user = claims;

      return await handler(request);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return createErrorResponse('Authentication error', 401);
    }
  };
}
