import { SessionLog } from '@/lib/types';

export const makeSession = (overrides: Partial<SessionLog> = {}): SessionLog => ({
  id: 's-1',
  userId: 'u1',
  campaignId: 'camp-1',
  sessionNumber: 11,
  title: 'The Betrayer Revealed',
  datePlayed: new Date(2026, 4, 14),
  summary: '',
  events: [],
  milestone: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
