import type { CampaignRoll, CampaignMember } from '@/lib/types';

export function canSeeRoll(
  roll: CampaignRoll,
  userId: string,
  members: Pick<CampaignMember, 'userId' | 'role' | 'status'>[]
): boolean {
  const member = members.find((m) => m.userId === userId && m.status === 'active');
  if (!member) return false;

  if (roll.visibility.scope === 'group') return true;

  // dm-only: DM(s) + roller
  return userId === roll.rollerId || member.role === 'dm';
}
