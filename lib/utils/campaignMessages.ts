import type { CampaignMessage, CampaignMember } from '@/lib/types';

export function canSeeMessage(
  msg: CampaignMessage,
  userId: string,
  members: Pick<CampaignMember, 'userId' | 'role' | 'status'>[]
): boolean {
  const member = members.find((m) => m.userId === userId && m.status === 'active');
  if (!member) return false;

  if (msg.visibility.scope === 'group') return true;

  if (msg.visibility.scope === 'direct') {
    return userId === msg.senderId || userId === msg.visibility.toUserId;
  }

  // dm-only: DM(s) + sender
  if (msg.visibility.scope === 'dm-only') {
    return userId === msg.senderId || member.role === 'dm';
  }

  return false;
}
