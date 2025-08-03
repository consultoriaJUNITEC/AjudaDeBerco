import { NextRequest } from 'next/server';
import { getDB } from '@/lib/database';
import { createResponse, createErrorResponse, generateUUID, normalizeText } from '@/lib/utils';
import { CreateDonorRequest, Donor } from '@/types/backend/donors';

export async function POST(request: NextRequest) {
  try {
    const body: CreateDonorRequest = await request.json();
    
    if (!body.name) {
      return createErrorResponse('Name is required', 400);
    }

    const db = getDB();
    const donorId = generateUUID();
    const normalizedName = normalizeText(body.name);
    
    const query = `
      INSERT INTO donors (id_donor, name, normalized_name)
      VALUES ($1, $2, $3)
      RETURNING id_donor, name, normalized_name, created_at
    `;
    
    const result = await db.query(query, [
      donorId,
      body.name,
      normalizedName
    ]);

    if (result.rows.length === 0) {
      return createErrorResponse('Failed to create donor', 500);
    }

    const row = result.rows[0];
    const donor: Donor = {
      id: row.id_donor,
      name: row.name,
      normalized_name: row.normalized_name,
      created_at: new Date(row.created_at),
    };

    return createResponse(donor, 201);
  } catch (error) {
    console.error('Create donor error:', error);
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
