/**
 * API route handler for encounters
 * Implements local-first offline-capable persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { offlineGet, offlinePost, offlinePut, offlineDelete } from '@/lib/api/offlineHandlers';
import { Encounter } from '@/lib/types';

/**
 * GET /api/encounters
 */
export async function GET(request: NextRequest) {
  return offlineGet('encounters');
}

/**
 * POST /api/encounters
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as Encounter;
  return offlinePost('encounters', body);
}

/**
 * PUT /api/encounters/:id
 */
export async function PUT(request: NextRequest) {
  const body = await request.json() as Encounter;
  return offlinePut('encounters', body);
}

/**
 * DELETE /api/encounters/:id
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  return offlineDelete('encounters', id || '');
}
