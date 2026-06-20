import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { getDatabase } from '@/lib/db';
import { getAttachmentsBucket, uploadAttachment, deleteOrphanedAttachments } from '@/lib/gridfs';

type Params = { id: string };

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  const access = await assertCampaignAccess(campaignId, auth.userId);
  if (access instanceof NextResponse) return access;
  if (access.role !== 'dm') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 });
  }

  let attachmentId: string;
  try {
    const db = await getDatabase();
    const bucket = getAttachmentsBucket(db);
    await deleteOrphanedAttachments(bucket, campaignId);
    attachmentId = await uploadAttachment(bucket, file, campaignId);
  } catch (err) {
    console.error('uploadAttachment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ attachmentId }, { status: 201 });
});
