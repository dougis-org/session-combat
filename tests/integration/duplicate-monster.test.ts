const mockLoadAll = jest.fn();
const mockSave = jest.fn();

jest.mock('../../lib/middleware', () => ({
  requireAuth: jest.fn(() => ({ userId: 'user-1' })),
}));

jest.mock('../../lib/storage', () => ({
  storage: {
    loadAllMonsterTemplates: (...args: any[]) => mockLoadAll(...args),
    saveMonsterTemplate: (...args: any[]) => mockSave(...args),
  },
}));


import { POST } from '../../app/api/monsters/[id]/duplicate/route';

describe('POST /api/monsters/[id]/duplicate', () => {
  beforeEach(() => {
    mockLoadAll.mockReset();
    mockSave.mockReset();
  });

  it('duplicates an existing template into the user library', async () => {
    const original: any = {
      id: 'orig-1',
      userId: 'GLOBAL_USER',
      name: 'Goblin',
      size: 'Medium',
      type: 'humanoid',
      ac: 10,
      hp: 7,
      maxHp: 7,
      speed: '30 ft.',
      challengeRating: 0,
      abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      isGlobal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockLoadAll.mockResolvedValue([original] as any);

    const res = await POST({} as any, { params: { id: 'orig-1' } } as any);

    expect(mockSave).toHaveBeenCalledTimes(1);
    const saved = mockSave.mock.calls[0][0] as any;
    expect(saved.userId).toBe('user-1');
    expect(saved.id).not.toBe('orig-1');
    expect(saved.name).toMatch(/Goblin/);
    // Expect a 201 NextResponse
    expect(res && (res as any).status).toBe(201);
  });
});
