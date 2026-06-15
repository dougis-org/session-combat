import { canSeeMessage } from '@/lib/utils/campaignMessages';
import type { CampaignMessage } from '@/lib/types';

const makeMsg = (overrides: Partial<CampaignMessage> = {}): CampaignMessage => ({
  id: 'msg-1',
  campaignId: 'camp-1',
  senderId: 'user-sender',
  senderName: 'Sender',
  text: 'Hello',
  visibility: { scope: 'group' },
  createdAt: new Date(),
  ...overrides,
});

const activePlayer = (userId: string) => ({ userId, role: 'player' as const, status: 'active' as const });
const activeDM = (userId: string) => ({ userId, role: 'dm' as const, status: 'active' as const });
const inactivePlayer = (userId: string) => ({ userId, role: 'player' as const, status: 'removed' as const });

describe('canSeeMessage', () => {
  describe('group scope', () => {
    it('T5.1 — active player can see group message', () => {
      const msg = makeMsg({ visibility: { scope: 'group' } });
      expect(canSeeMessage(msg, 'user-a', [activePlayer('user-a')])).toBe(true);
    });

    it('T5.2 — active DM can see group message', () => {
      const msg = makeMsg({ visibility: { scope: 'group' } });
      expect(canSeeMessage(msg, 'user-dm', [activeDM('user-dm')])).toBe(true);
    });

    it('T5.3 — inactive member cannot see group message', () => {
      const msg = makeMsg({ visibility: { scope: 'group' } });
      expect(canSeeMessage(msg, 'user-a', [inactivePlayer('user-a')])).toBe(false);
    });
  });

  describe('direct scope', () => {
    const msg = makeMsg({
      senderId: 'user-a',
      visibility: { scope: 'direct', toUserId: 'user-b' },
    });

    it('T5.4 — recipient can see direct message', () => {
      expect(canSeeMessage(msg, 'user-b', [activePlayer('user-a'), activePlayer('user-b')])).toBe(true);
    });

    it('T5.5 — sender can see their own direct message', () => {
      expect(canSeeMessage(msg, 'user-a', [activePlayer('user-a'), activePlayer('user-b')])).toBe(true);
    });

    it('T5.6 — unrelated active player cannot see direct message', () => {
      expect(canSeeMessage(msg, 'user-c', [activePlayer('user-a'), activePlayer('user-b'), activePlayer('user-c')])).toBe(false);
    });
  });

  describe('dm-only scope', () => {
    const msg = makeMsg({
      senderId: 'user-player',
      visibility: { scope: 'dm-only' },
    });

    it('T5.7 — sender (player) can see their own dm-only message', () => {
      expect(canSeeMessage(msg, 'user-player', [activePlayer('user-player'), activeDM('user-dm')])).toBe(true);
    });

    it('T5.8 — DM who is not sender can see dm-only message', () => {
      expect(canSeeMessage(msg, 'user-dm', [activePlayer('user-player'), activeDM('user-dm')])).toBe(true);
    });

    it('T5.9 — unrelated active player cannot see dm-only message', () => {
      expect(canSeeMessage(msg, 'user-b', [activePlayer('user-player'), activeDM('user-dm'), activePlayer('user-b')])).toBe(false);
    });

    it('T5.10 — co-DM can see dm-only message', () => {
      expect(canSeeMessage(msg, 'user-dm2', [activePlayer('user-player'), activeDM('user-dm'), activeDM('user-dm2')])).toBe(true);
    });
  });

  it('T5.11 — user not in members list cannot see any message', () => {
    const groupMsg = makeMsg({ visibility: { scope: 'group' } });
    expect(canSeeMessage(groupMsg, 'user-unknown', [activePlayer('user-a')])).toBe(false);
  });
});
