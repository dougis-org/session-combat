/**
 * API route handler for characters - stub implementation
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: [], source: 'remote' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(body);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(body);
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: true });
}
