/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '@/lib/db';
import { checkAndIncrementRateLimit } from '@/lib/db/feedbackRateLimit';

const mockedGetDatabase = jest.mocked(getDatabase);

function makeCollection(overrides: Record<string, jest.Mock> = {}) {
  return {
    createIndex: jest.fn().mockResolvedValue(undefined),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    findOne: jest.fn().mockResolvedValue(null),
    replaceOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockDb(collection: ReturnType<typeof makeCollection>) {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue(collection),
  } as any);
  return collection;
}

describe('checkAndIncrementRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TTL index test must run first (before indexEnsured is set to true)
  it('ensures TTL index on collection init (first call)', async () => {
    const col = mockDb(makeCollection());
    await checkAndIncrementRateLimit('9.9.9.9');
    expect(col.createIndex).toHaveBeenCalledWith(
      { windowResetAt: 1 },
      expect.objectContaining({ expireAfterSeconds: 0 })
    );
  });

  it('allows submission within limit — returns allowed:true when atomic increment succeeds', async () => {
    const col = mockDb(makeCollection({
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    }));
    const result = await checkAndIncrementRateLimit('1.2.3.4');
    expect(result).toEqual({ allowed: true });
    expect(col.updateOne).toHaveBeenCalled();
  });

  it('allows first submission from new IP — upserts with count 1 when no active window', async () => {
    const col = mockDb(makeCollection({
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      findOne: jest.fn().mockResolvedValue(null),
    }));
    const result = await checkAndIncrementRateLimit('1.2.3.4');
    expect(result).toEqual({ allowed: true });
    expect(col.replaceOne).toHaveBeenCalledWith(
      { ip: { $eq: '1.2.3.4' } },
      expect.objectContaining({ ip: '1.2.3.4', count: 1 }),
      { upsert: true }
    );
  });

  it('rejects submission when over limit — returns allowed:false', async () => {
    const col = mockDb(makeCollection({
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      findOne: jest.fn().mockResolvedValue({ ip: '1.2.3.4', count: 12 }),
    }));
    const result = await checkAndIncrementRateLimit('1.2.3.4');
    expect(result).toEqual({ allowed: false });
    expect(col.replaceOne).not.toHaveBeenCalled();
  });
});
