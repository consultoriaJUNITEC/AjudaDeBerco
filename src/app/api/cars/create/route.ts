import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { verifyPasswordDirectly, verifyToken } from '@/lib/auth';
import { createResponse, createErrorResponse, generateUUID } from '@/lib/utils';
import { CreateCarRequest, Car } from '@/types/backend/cars';

export async function POST(request: NextRequest) {
  try {
    const body: CreateCarRequest = await request.json();
    
    if (!body.password) {
      return createErrorResponse('Password is required', 400);
    }

    if (!body.type || (body.type !== 'Entrada' && body.type !== 'Saída')) {
      return createErrorResponse('Invalid cart type. Must be "Entrada" or "Saída"', 400);
    }

    // Verify password
    const isValidDirect = verifyPasswordDirectly(body.password);
    let isValid = isValidDirect;

    if (!isValid) {
      const tokenClaims = verifyToken(body.password);
      isValid = !!tokenClaims;
    }

    if (!isValid) {
      return createErrorResponse('Invalid password', 403);
    }

    // Create new cart
    const db = getDB();
    const cartId = generateUUID();
    
    const query = `
      INSERT INTO cars (id_car, type, date_export)
      VALUES ($1, $2, '0')
      RETURNING id_car, type, date_export
    `;
    
    const result = await db.query(query, [cartId, body.type]);
    
    if (result.rows.length === 0) {
      return createErrorResponse('Failed to create cart', 500);
    }

    const car: Car = {
      id: result.rows[0].id_car,
      type: result.rows[0].type,
      products: {},
      created_at: new Date(),
      date_export: result.rows[0].date_export,
    };

    return createResponse(car, 201);
  } catch (error) {
    console.error('Create cart error:', error);
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
