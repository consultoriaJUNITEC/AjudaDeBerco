import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { Car, ProductInCar } from '@/types/backend/cars';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('id');
    
    if (!cartId) {
      return createErrorResponse('Cart ID is required', 400);
    }

    const db = getDB();
    
    // Get cart info
    const cartQuery = `
      SELECT id_car, type, date_export
      FROM cars
      WHERE id_car = $1
    `;
    
    const cartResult = await db.query(cartQuery, [cartId]);
    
    if (cartResult.rows.length === 0) {
      return createErrorResponse('Cart not found', 404);
    }

    // Get cart products
    const productsQuery = `
      SELECT 
        pc.id_product,
        p.name,
        p.unit,
        pc.quantity,
        pc.expiration_date
      FROM products_car pc
      JOIN products p ON pc.id_product = p.id_product
      WHERE pc.id_car = $1
      ORDER BY pc.expiration_date
    `;
    
    const productsResult = await db.query(productsQuery, [cartId]);
    
    // Group products by ID
    const products: { [productId: string]: ProductInCar[] } = {};
    
    for (const row of productsResult.rows) {
      const product: ProductInCar = {
        id: row.id_product,
        name: row.name,
        unit: row.unit,
        quantity: row.quantity,
        expiration_date: new Date(row.expiration_date),
      };
      
      if (!products[row.id_product]) {
        products[row.id_product] = [];
      }
      
      products[row.id_product].push(product);
    }

    const car: Car = {
      id: cartResult.rows[0].id_car,
      type: cartResult.rows[0].type,
      products,
      created_at: new Date(), // This would need to be stored in DB
      date_export: cartResult.rows[0].date_export,
    };

    return createResponse(car);
  } catch (error) {
    console.error('Get cart error:', error);
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
