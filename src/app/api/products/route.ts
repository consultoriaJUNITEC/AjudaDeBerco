import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { Product } from '@/types/backend/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const db = getDB();
    
    let query = `
      SELECT id_product, name, normalized_name, unit, pos_x, pos_y, created_at
      FROM products
    `;
    
    const params: any[] = [];
    
    if (search) {
      query += ` WHERE normalized_name ILIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }
    
    query += ` ORDER BY name`;
    
    const result = await db.query(query, params);
    
    const products: Product[] = result.rows.map((row: any) => ({
      id: row.id_product,
      name: row.name,
      normalized_name: row.normalized_name,
      unit: row.unit,
      position_x: row.pos_x,
      position_y: row.pos_y,
      created_at: new Date(row.created_at),
    }));

    return createResponse(products);
  } catch (error) {
    console.error('Get products error:', error);
    return createErrorResponse('Internal server error', 500);
  }
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
