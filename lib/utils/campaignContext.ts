import { Campaign, Character, CampaignContext, Party, PartyMember, SessionLog, SharedCharacterEntry } from '@/lib/types';

export async function fetchCampaignContext(
  campaignId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CampaignContext> {
  const [campaignRes, partiesRes, charactersRes, sessionsRes, sharedCharsRes] = await Promise.all([
    fetchImpl(`/api/campaigns/${campaignId}`),
    fetchImpl('/api/parties'),
    fetchImpl('/api/characters'),
    fetchImpl(`/api/campaigns/${campaignId}/sessions?limit=3`).catch((e: unknown) => {
      console.error('Sessions fetch error:', e);
      return null;
    }),
    fetchImpl(`/api/campaigns/${campaignId}/characters`).catch((e: unknown) => {
      console.error('Shared characters fetch error:', e);
      return null;
    }),
  ]);

  if (!campaignRes.ok) throw new Error('Failed to fetch campaign');
  if (!partiesRes.ok) throw new Error('Failed to fetch parties');
  if (!charactersRes.ok) throw new Error('Failed to fetch characters');

  const [campaign, allParties, dmCharacters]: [Campaign, Party[], Character[]] = await Promise.all([
    campaignRes.json(),
    partiesRes.json(),
    charactersRes.json(),
  ]);

  let sharedEntries: SharedCharacterEntry[] = [];
  try {
    if (sharedCharsRes?.ok) {
      const data = await sharedCharsRes.json();
      sharedEntries = Array.isArray(data) ? data as SharedCharacterEntry[] : [];
    } else if (sharedCharsRes) {
      console.error('Shared characters fetch failed with status:', sharedCharsRes.status);
    }
  } catch (e) {
    console.error('Shared characters response parse error:', e);
  }

  const activeShareIds = new Set(
    sharedEntries.filter(e => !e.character.deletedAt).map(e => e.share.characterId)
  );

  const sharedCharacters: Character[] = sharedEntries
    .filter(e => !e.character.deletedAt)
    .map(e => e.character as unknown as Character);

  const allCharactersById = new Map<string, Character>();
  for (const c of dmCharacters) {
    allCharactersById.set(c.id, c);
  }
  for (const c of sharedCharacters) {
    if (!allCharactersById.has(c.id)) {
      allCharactersById.set(c.id, c);
    }
  }

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

  const dmUserIds = new Set(dmCharacters.map(c => c.userId));

  const characters = Array.from(allCharactersById.values()).filter(c => {
    if (!memberIds.has(c.id)) return false;
    if (c.deletedAt) return false;
    if (!dmUserIds.has(c.userId) && !activeShareIds.has(c.id)) return false;
    return true;
  });

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
