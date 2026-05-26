import { SessionLog } from '@/lib/types';

export const makeSession = (overrides: Partial<SessionLog> = {}): SessionLog => ({
  id: 's-1',
  userId: 'u1',
  campaignId: 'camp-1',
  sessionNumber: 11,
  title: 'The Betrayer Revealed',
  datePlayed: new Date('2026-05-14T12:00:00Z'),
  summary: '',
  events: [],
  milestone: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
