import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { withAuth } from '@/lib/middleware';
import { Car, ProductInCar } from '@/types/backend/cars';

async function getAllCarsHandler(request: NextRequest) {
  try {
    const db = getDB();
    
    // Get all cars
    const carsQuery = `
      SELECT id_car, type, date_export
      FROM cars
      ORDER BY id_car
    `;
    
    const carsResult = await db.query(carsQuery);
    
    const cars: Car[] = [];
    
    for (const carRow of carsResult.rows) {
      // Get products for this car
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
      
      const productsResult = await db.query(productsQuery, [carRow.id_car]);
      
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
        id: carRow.id_car,
        type: carRow.type,
        products,
        created_at: new Date(), // This would need to be stored in DB
        date_export: carRow.date_export,
      };
      
      cars.push(car);
    }

    return createResponse(cars);
  } catch (error) {
    console.error('Get all cars error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export const GET = withAuth(getAllCarsHandler);

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
