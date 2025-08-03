import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse, generateUUID, normalizeText } from '@/lib/utils';
import { CreateProductRequest, Product } from '@/types/backend/products';

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductRequest = await request.json();
    
    if (!body.name || !body.unit) {
      return createErrorResponse('Name and unit are required', 400);
    }

    const db = getDB();
    const productId = generateUUID();
    const normalizedName = normalizeText(body.name);
    
    const query = `
      INSERT INTO products (id_product, name, normalized_name, unit, pos_x, pos_y)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_product, name, normalized_name, unit, pos_x, pos_y, created_at
    `;
    
    const result = await db.query(query, [
      productId,
      body.name,
      normalizedName,
      body.unit,
      body.position_x || 0,
      body.position_y || 0
    ]);

    if (result.rows.length === 0) {
      return createErrorResponse('Failed to create product', 500);
    }

    const row = result.rows[0];
    const product: Product = {
      id: row.id_product,
      name: row.name,
      normalized_name: row.normalized_name,
      unit: row.unit,
      position_x: row.pos_x,
      position_y: row.pos_y,
      created_at: new Date(row.created_at),
    };

    return createResponse(product, 201);
  } catch (error) {
    console.error('Create product error:', error);
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
