import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { emitFiltered } from '@/lib/server/transport';
import { canSeeRoll } from '@/lib/utils/campaignRolls';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import type { CampaignRoll, RollVisibility } from '@/lib/types';

type Params = { id: string };

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const { formula, rolls, total, label, visibility } = b;

    if (typeof formula !== 'string' || formula.trim() === '') {
      return NextResponse.json({ error: 'formula is required' }, { status: 400 });
    }

    if (!Array.isArray(rolls) || !rolls.every((v) => typeof v === 'number' && Number.isFinite(v))) {
      return NextResponse.json({ error: 'rolls must be an array of finite numbers' }, { status: 400 });
    }

    if (typeof total !== 'number' || !Number.isFinite(total)) {
      return NextResponse.json({ error: 'total must be a finite number' }, { status: 400 });
    }

    if (!visibility || typeof visibility !== 'object') {
      return NextResponse.json({ error: 'visibility is required' }, { status: 400 });
    }

    const vis = visibility as Record<string, unknown>;
    const scope = vis['scope'];
    if (scope !== 'group' && scope !== 'dm-only') {
      return NextResponse.json({ error: 'visibility.scope must be group or dm-only' }, { status: 400 });
    }

    const rollVisibility: RollVisibility = { scope };

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
      formula: formula.trim(),
      rolls: rolls as number[],
      total,
      ...(typeof label === 'string' && label.trim() ? { label: label.trim() } : {}),
      visibility: rollVisibility,
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
    const caller = await storage.getMember(campaignId, auth.userId);
    if (!caller || caller.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
