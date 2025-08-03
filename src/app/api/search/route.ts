import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse, normalizeText } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // products, donors, or all
    
    if (!query) {
      return createErrorResponse('Search query is required', 400);
    }

    const db = getDB();
    const normalizedQuery = normalizeText(query);
    const results: any = {};

    if (type === 'products' || type === 'all') {
      const productsQuery = `
        SELECT id_product, name, unit, pos_x, pos_y
        FROM products
        WHERE normalized_name ILIKE $1
        ORDER BY name
        LIMIT 20
      `;
      
      const productsResult = await db.query(productsQuery, [`%${normalizedQuery}%`]);
      
      results.products = productsResult.rows.map((row: any) => ({
        id: row.id_product,
        name: row.name,
        unit: row.unit,
        position_x: row.pos_x,
        position_y: row.pos_y,
      }));
    }

    if (type === 'donors' || type === 'all') {
      const donorsQuery = `
        SELECT id_donor, name
        FROM donors
        WHERE normalized_name ILIKE $1
        ORDER BY name
        LIMIT 20
      `;
      
      const donorsResult = await db.query(donorsQuery, [`%${normalizedQuery}%`]);
      
      results.donors = donorsResult.rows.map((row: any) => ({
        id: row.id_donor,
        name: row.name,
      }));
    }

    return createResponse(results);
  } catch (error) {
    console.error('Search error:', error);
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
