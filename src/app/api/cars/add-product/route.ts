import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { AddProductRequest } from '@/types/backend/cars';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cart_id');
    
    if (!cartId) {
      return createErrorResponse('Cart ID is required', 400);
    }

    const body: AddProductRequest = await request.json();
    
    if (!body.product_id || !body.quantity || !body.expiration_date) {
      return createErrorResponse('Product ID, quantity, and expiration date are required', 400);
    }

    const db = getDB();
    
    // Check if cart exists
    const cartCheck = await db.query('SELECT id_car FROM cars WHERE id_car = $1', [cartId]);
    if (cartCheck.rows.length === 0) {
      return createErrorResponse('Cart not found', 404);
    }

    // Check if product exists
    const productCheck = await db.query('SELECT id_product FROM products WHERE id_product = $1', [body.product_id]);
    if (productCheck.rows.length === 0) {
      return createErrorResponse('Product not found', 404);
    }

    // Add product to cart
    const query = `
      INSERT INTO products_car (id_car, id_product, quantity, expiration_date)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const result = await db.query(query, [
      cartId,
      body.product_id,
      body.quantity,
      new Date(body.expiration_date)
    ]);

    if (result.rows.length === 0) {
      return createErrorResponse('Failed to add product to cart', 500);
    }

    return createResponse({ 
      message: 'Product added to cart successfully',
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Add product to cart error:', error);
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
