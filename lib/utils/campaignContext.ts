import { Campaign, Character, CampaignContext, Party } from '@/lib/types';

export async function fetchCampaignContext(
  campaignId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CampaignContext> {
  const [campaignRes, partiesRes, charactersRes] = await Promise.all([
    fetchImpl(`/api/campaigns/${campaignId}`),
    fetchImpl('/api/parties'),
    fetchImpl('/api/characters'),
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
  const allMembers = Array.from(
    new Map(parties.flatMap(p => p.members).map(m => [m.characterId, m])).values(),
  );
  const memberIds = new Set(allMembers.map(m => m.characterId));

  const chapter = campaign.currentChapterId
    ? (campaign.chapters.find(c => c.id === campaign.currentChapterId) ?? null)
    : null;

  const characters = allCharacters.filter(
    c => memberIds.has(c.id) && !c.deletedAt,
  );

  return { campaign, chapter, parties, allMembers, characters };
}
