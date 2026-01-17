/**
 * API route handler for combat - stub implementation
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: null, source: 'remote' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(body);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(body);
}
