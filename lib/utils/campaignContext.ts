import { Campaign, Character, CampaignContext, Party, PartyMember, SessionLog } from '@/lib/types';

export async function fetchCampaignContext(
  campaignId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CampaignContext> {
  const [campaignRes, partiesRes, charactersRes, sessionsRes] = await Promise.all([
    fetchImpl(`/api/campaigns/${campaignId}`),
    fetchImpl('/api/parties'),
    fetchImpl('/api/characters'),
    fetchImpl(`/api/campaigns/${campaignId}/sessions?limit=3`).catch((e: unknown) => {
      console.error('Sessions fetch error:', e);
      return null;
    }),
  ]);

  if (!campaignRes.ok) throw new Error('Failed to fetch campaign');
  if (!partiesRes.ok) throw new Error('Failed to fetch parties');
  if (!charactersRes.ok) throw new Error('Failed to fetch characters');

  const [campaign, allParties, allCharacters]: [Campaign, Party[], Character[]] = await Promise.all([
    campaignRes.json(),
    partiesRes.json(),
    charactersRes.json(),
  ]);

  const parties = allParties.filter(p => p.campaignId === campaignId);
  const allMembersRaw = parties.flatMap(p => p.members);
  const seen = new Set<string>();
  const allMembers: PartyMember[] = [];
  for (const m of allMembersRaw) {
    const key = `${m.characterId}_${new Date(m.addedAt).getTime()}_${m.leftAt ? new Date(m.leftAt).getTime() : 'active'}`;
    if (!seen.has(key)) {
      seen.add(key);
      allMembers.push(m);
    }
  }
  // Only active members (no leftAt) determine which characters appear in prompt context;
  // allMembers retains the full history for session-event timeline diffing.
  const memberIds = new Set(allMembers.filter(m => !m.leftAt).map(m => m.characterId));

  const chapter = campaign.currentChapterId
    ? (campaign.chapters.find(c => c.id === campaign.currentChapterId) ?? null)
    : null;

  const characters = allCharacters.filter(
    c => memberIds.has(c.id) && !c.deletedAt,
  );

  let recentSessions: SessionLog[] = [];
  try {
    if (sessionsRes?.ok) {
      const data = await sessionsRes.json();
      recentSessions = Array.isArray(data) ? data as SessionLog[] : [];
    } else if (sessionsRes) {
      console.error('Sessions fetch failed with status:', sessionsRes.status);
    }
  } catch (e) {
    console.error('Sessions response parse error:', e);
  }

  return { campaign, chapter, parties, allMembers, characters, recentSessions };
}
