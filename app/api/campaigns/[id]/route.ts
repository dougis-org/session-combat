import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const campaign = await storage.loadCampaignById(id, auth.userId);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const campaign = await storage.loadCampaignById(id, auth.userId);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, moduleName, currentChapter, currentChapterOrder, active } = body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
      }
    }

    const updated = {
      ...campaign,
      ...(name !== undefined && typeof name === 'string' && { name: name.trim() }),
      ...(moduleName !== undefined && typeof moduleName === 'string' && { moduleName: moduleName.trim() }),
      ...(currentChapter !== undefined && typeof currentChapter === 'string' && { currentChapter: currentChapter.trim() }),
      ...(currentChapterOrder !== undefined && typeof currentChapterOrder === 'number' && isFinite(currentChapterOrder) && { currentChapterOrder }),
      ...(active !== undefined && typeof active === 'boolean' && { active }),
      updatedAt: new Date(),
    };

    await storage.saveCampaign(updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const campaign = await storage.loadCampaignById(id, auth.userId);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    await storage.deleteCampaign(id, auth.userId);

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
