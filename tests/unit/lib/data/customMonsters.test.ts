import { CUSTOM_MONSTERS } from '../../../../lib/data/customMonsters';
import { GLOBAL_USER_ID } from '../../../../lib/constants';

describe('customMonsters', () => {
  it('should have custom monsters exported', () => {
    expect(Array.isArray(CUSTOM_MONSTERS)).toBe(true);
    expect(CUSTOM_MONSTERS.length).toBeGreaterThan(0);
  });

  it('all monsters should have GLOBAL_USER_ID and be global', () => {
    for (const monster of CUSTOM_MONSTERS) {
      expect(monster.userId).toBe(GLOBAL_USER_ID);
      expect(monster.isGlobal).toBe(true);
      expect(monster.id).toMatch(/^cm-/);
      expect(monster.name).toBeDefined();
    }
  });
});
