import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { RemoveProductRequest } from '@/types/backend/cars';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cart_id');
    
    if (!cartId) {
      return createErrorResponse('Cart ID is required', 400);
    }

    const body: RemoveProductRequest = await request.json();
    
    if (!body.product_id || !body.expiration_date) {
      return createErrorResponse('Product ID and expiration date are required', 400);
    }

    const db = getDB();
    
    // Remove specific product entry from cart
    const query = `
      DELETE FROM products_car
      WHERE id_car = $1 AND id_product = $2 AND expiration_date = $3
      RETURNING id
    `;
    
    const result = await db.query(query, [
      cartId,
      body.product_id,
      new Date(body.expiration_date)
    ]);

    if (result.rows.length === 0) {
      return createErrorResponse('Product not found in cart', 404);
    }

    return createResponse({ 
      message: 'Product removed from cart successfully' 
    });
  } catch (error) {
    console.error('Remove product from cart error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
