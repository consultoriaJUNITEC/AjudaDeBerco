import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { UpdateProductQuantityRequest } from '@/types/backend/cars';

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cart_id');
    
    if (!cartId) {
      return createErrorResponse('Cart ID is required', 400);
    }

    const body: UpdateProductQuantityRequest = await request.json();
    
    if (!body.product_id || !body.quantity || !body.expiration_date) {
      return createErrorResponse('Product ID, quantity, and expiration date are required', 400);
    }

    const db = getDB();
    
    // Update product quantity in cart
    const query = `
      UPDATE products_car
      SET quantity = $1
      WHERE id_car = $2 AND id_product = $3 AND expiration_date = $4
      RETURNING id
    `;
    
    const result = await db.query(query, [
      body.quantity,
      cartId,
      body.product_id,
      new Date(body.expiration_date)
    ]);

    if (result.rows.length === 0) {
      return createErrorResponse('Product not found in cart', 404);
    }

    return createResponse({ 
      message: 'Product quantity updated successfully' 
    });
  } catch (error) {
    console.error('Update product quantity error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
