import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { getDatabase } from '@/lib/db';
import { getAttachmentsBucket, openDownloadStream } from '@/lib/gridfs';

type Params = { id: string; attachmentId: string };

export const GET = withAuthAndParams<Params>(
  async (_request, auth, { id: campaignId, attachmentId }) => {
    const access = await assertCampaignAccess(campaignId, auth.userId);
    if (access instanceof NextResponse) return access;

    const db = await getDatabase();
    const bucket = getAttachmentsBucket(db);

    let streamResult: Awaited<ReturnType<typeof openDownloadStream>>;
    try {
      streamResult = await openDownloadStream(bucket, attachmentId);
    } catch (err: unknown) {
      const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
      if (code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (code === 'INVALID_ID') {
        return NextResponse.json({ error: 'Invalid attachmentId' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const { stream, contentType, campaignId: fileCampaignId } = streamResult;

    if (fileCampaignId !== campaignId) {
      stream.destroy();
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  },
);
