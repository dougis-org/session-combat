import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { requireAdmin } from '@/lib/api-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const deleted = await storage.deleteCampaignTemplate(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Campaign template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting global campaign template:', error);
    return NextResponse.json({ error: 'Failed to delete global campaign template' }, { status: 500 });
  }
}
