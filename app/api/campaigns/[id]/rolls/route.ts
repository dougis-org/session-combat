import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { emitFiltered } from '@/lib/server/transport';
import { canSeeRoll } from '@/lib/utils/campaignRolls';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { readBoundedJson } from '@/lib/server/readBoundedJson';
import { rollSubmissionSchema } from '@/lib/validation/rollSubmission';
import type { CampaignRoll } from '@/lib/types';

type Params = { id: string };

/** JSON-only endpoint; a well-formed roll payload is well under 2 KiB, so 16 KiB gives large headroom. */
export const ROLL_BODY_MAX_BYTES = 16 * 1024;

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const read = await readBoundedJson(request, ROLL_BODY_MAX_BYTES);
    if (!read.ok) {
      if (read.reason === 'oversize') {
        return NextResponse.json({ error: 'Request body is too large' }, { status: 413 });
      }
      if (read.reason === 'invalid-json') {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const parsed = rollSubmissionSchema.safeParse(read.value);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue?.path?.length ? `${firstIssue.path.join('.')}: ` : '';
      return NextResponse.json({ error: `${field}${firstIssue?.message ?? 'Invalid roll payload'}` }, { status: 400 });
    }

    const { formula, rolls, total, label, visibility } = parsed.data;

    const caller = await storage.getMember(campaignId, auth.userId);
    if (!caller || caller.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessResult = await assertCampaignAccess(campaignId, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    const { campaign } = accessResult;

    if (!campaign.activeSessionId) {
      return NextResponse.json({ error: 'No active session' }, { status: 409 });
    }

    const user = await storage.getUserById(auth.userId);
    const rollerName = user?.username ?? 'Unknown';

    const roll: CampaignRoll = {
      id: crypto.randomUUID(),
      campaignId,
      sessionId: campaign.activeSessionId,
      rollerId: auth.userId,
      rollerName,
      formula,
      rolls,
      total,
      ...(label?.trim() ? { label: label.trim() } : {}),
      visibility,
      createdAt: new Date(),
    };

    await storage.saveCampaignRoll(roll);

    const activeMembers = await storage.listMembersForCampaign(campaignId);
    const activeMembersFiltered = activeMembers.filter((m) => m.status === 'active');

    emitFiltered(
      campaignId,
      { type: 'roll', campaignId, data: roll },
      (uid) => canSeeRoll(roll, uid, activeMembersFiltered)
    );

    return NextResponse.json(roll, { status: 201 });
  } catch (error) {
    console.error('Error posting campaign roll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const GET = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    // Validate query input before any database lookup — malformed requests
    // are rejected without spending a `getMember` round-trip.
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId || sessionId.trim() === '') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10);
    const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 50 : rawLimit, 100);

    const beforeParam = searchParams.get('before');
    let before: Date | undefined;
    if (beforeParam) {
      const parsed = new Date(beforeParam);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid before cursor' }, { status: 400 });
      }
      before = parsed;
    }

    const caller = await storage.getMember(campaignId, auth.userId);
    if (!caller || caller.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await storage.listCampaignRolls(
      campaignId,
      sessionId.trim(),
      auth.userId,
      caller.role,
      { limit, before }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing campaign rolls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
