import type { CampaignMessage, CampaignMember } from '@/lib/types';

export function canSeeMessage(
  msg: CampaignMessage,
  userId: string,
  members: Pick<CampaignMember, 'userId' | 'role' | 'status'>[]
): boolean {
  const member = members.find((m) => m.userId === userId && m.status === 'active');
  if (!member) return false;

  const { scope } = msg.visibility;

  if (scope === 'group') return true;

  if (scope === 'direct') {
    const toUserId = (msg.visibility as { scope: 'direct'; toUserId: string }).toUserId;
    return userId === msg.senderId || userId === toUserId;
  }

  // dm-only: DM(s) + sender
  if (scope === 'dm-only') {
    return userId === msg.senderId || member.role === 'dm';
  }

  return false;
}
