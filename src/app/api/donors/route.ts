import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse } from '@/lib/utils';
import { Donor } from '@/types/backend/donors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const db = getDB();
    
    let query = `
      SELECT id_donor, name, normalized_name, created_at
      FROM donors
    `;
    
    const params: any[] = [];
    
    if (search) {
      query += ` WHERE normalized_name ILIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }
    
    query += ` ORDER BY name`;
    
    const result = await db.query(query, params);
    
    const donors: Donor[] = result.rows.map((row: any) => ({
      id: row.id_donor,
      name: row.name,
      normalized_name: row.normalized_name,
      created_at: new Date(row.created_at),
    }));

    return createResponse(donors);
  } catch (error) {
    console.error('Get donors error:', error);
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
