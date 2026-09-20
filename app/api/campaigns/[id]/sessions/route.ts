import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { SessionLog } from '@/lib/types';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { readBoundedJson, boundedJsonErrorResponse } from '@/lib/server/readBoundedJson';
import { zodErrorResponse } from '@/lib/server/zodErrorResponse';
import { sessionLogSubmissionSchema } from '@/lib/validation/sessionLog';

type Params = { id: string };

/** Session logs carry more free text than a roll payload (summary up to 10,000 chars, up to 200 events); 64 KiB gives comfortable headroom over the max-bounded shape. */
export const SESSION_BODY_MAX_BYTES = 64 * 1024;

async function resolveSessionNumber(
  campaignUserId: string,
  campaignId: string,
  sessionNumber: number | undefined,
): Promise<number | NextResponse> {
  if (sessionNumber !== undefined) return sessionNumber;
  try {
    return await storage.getNextSessionNumber(campaignUserId, campaignId);
  } catch (error) {
    console.error('Error determining next session number:', error);
    return NextResponse.json(
      { error: 'Failed to determine next session number', code: 'SESSION_NUMBER_UNAVAILABLE' },
      { status: 503 },
    );
  }
}

export const GET = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign } = result;

    const logs = await storage.loadSessionLogs(campaign.userId, campaignId);
    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    return NextResponse.json(limit && limit > 0 ? logs.slice(0, limit) : logs);
  } catch (error) {
    console.error('Error fetching session logs:', error);
    return NextResponse.json({ error: 'Failed to fetch session logs' }, { status: 500 });
  }
});

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign, role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const read = await readBoundedJson(request, SESSION_BODY_MAX_BYTES);
    if (!read.ok) {
      return boundedJsonErrorResponse(read.reason);
    }

    const parsed = sessionLogSubmissionSchema.safeParse(read.value);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error, 'Invalid session log payload');
    }
    const { datePlayed, title, summary, events, sessionNumber, milestone, newLevel } = parsed.data;

    const resolvedSessionNumber = await resolveSessionNumber(campaign.userId, campaignId, sessionNumber);
    if (resolvedSessionNumber instanceof NextResponse) return resolvedSessionNumber;

    const now = new Date();
    const log: SessionLog = {
      id: crypto.randomUUID(),
      userId: campaign.userId,
      campaignId,
      sessionNumber: resolvedSessionNumber,
      title: title || undefined,
      datePlayed,
      summary,
      events,
      milestone,
      ...(milestone && newLevel !== undefined && { newLevel }),
      createdAt: now,
      updatedAt: now,
    };

    await storage.saveSessionLog(log);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating session log:', error);
    return NextResponse.json({ error: 'Failed to create session log' }, { status: 500 });
  }
});
