import {
  normalizeAbilityScores,
  normalizeCurrentHp,
  normalizeMaxHp,
} from "@/lib/import/dndBeyond-ability-scores";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";

function requireDefined<T>(value: T | undefined | null, label: string): T {
  if (value == null) throw new Error(`${label} must be defined in fixture`);
  return value;
}

const sampleStats = requireDefined(sampleDndBeyondCharacterResponse.data.stats, "stats");
const sampleBonusStats = requireDefined(sampleDndBeyondCharacterResponse.data.bonusStats, "bonusStats");
const sampleOverrideStats = requireDefined(sampleDndBeyondCharacterResponse.data.overrideStats, "overrideStats");

const baseAbilityScores = {
  strength: 10,
  dexterity: 17,
  constitution: 14,
  intelligence: 16,
  wisdom: 10,
  charisma: 21,
};

describe("dndBeyond-ability-scores", () => {
  describe("normalizeAbilityScores", () => {
    test("fails when a required ability score is missing (stat id 6 / charisma)", () => {
      expect(() =>
        normalizeAbilityScores(
          { stats: sampleStats.filter((s) => s.id !== 6) },
          [],
        ),
      ).toThrow(/missing charisma data/i);
    });

    test("prefers override stat when present", () => {
      const result = normalizeAbilityScores(
        {
          stats: sampleStats,
          bonusStats: sampleBonusStats.map((s) =>
            s.id === 2 ? { ...s, value: 5 } : s,
          ),
          overrideStats: sampleOverrideStats.map((s) =>
            s.id === 2 ? { ...s, value: 20 } : s,
          ),
        },
        [],
      );
      expect(result.dexterity).toBe(20);
    });
  });

  describe("normalizeCurrentHp", () => {
    test("clamps explicit current hit points to maxHp when they exceed it", () => {
      const hp = normalizeCurrentHp({ currentHitPoints: 999 }, 44);
      expect(hp).toBe(44);
    });

    test("derives HP from removedHitPoints when currentHitPoints is undefined, clamps at 0", () => {
      const hp = normalizeCurrentHp(
        { removedHitPoints: 999, currentHitPoints: undefined },
        92,
      );
      expect(hp).toBe(0);
    });
  });

  describe("normalizeMaxHp", () => {
    test("returns overrideHitPoints when set", () => {
      const maxHp = normalizeMaxHp(
        { overrideHitPoints: 44 },
        baseAbilityScores,
        12,
        [],
      );
      expect(maxHp).toBe(44);
    });

    test("adds hit-points-per-level modifier times total level to max HP", () => {
      // base 68 + con mod 2 * 12 = 92; per-level 1 * 12 = +12 → 104
      const maxHp = normalizeMaxHp(
        { baseHitPoints: 68, bonusHitPoints: null, overrideHitPoints: null },
        baseAbilityScores,
        12,
        [
          {
            type: "bonus",
            subType: "hit-points-per-level",
            value: 1,
            fixedValue: null,
            friendlySubtypeName: null,
          },
        ],
      );
      expect(maxHp).toBe(104);
    });

    test("adds flat hit-points modifier to max HP", () => {
      // base 68 + con mod 2 * 12 = 92; flat +4 → 96
      const maxHp = normalizeMaxHp(
        { baseHitPoints: 68, bonusHitPoints: null, overrideHitPoints: null },
        baseAbilityScores,
        12,
        [
          {
            type: "bonus",
            subType: "hit-points",
            fixedValue: 4,
            value: null,
            friendlySubtypeName: null,
          },
        ],
      );
      expect(maxHp).toBe(96);
    });

    test("adds both per-level and flat HP modifiers to max HP", () => {
      // base 92; per-level +12; flat +4 → 108
      const maxHp = normalizeMaxHp(
        { baseHitPoints: 68, bonusHitPoints: null, overrideHitPoints: null },
        baseAbilityScores,
        12,
        [
          {
            type: "bonus",
            subType: "hit-points-per-level",
            value: 1,
            fixedValue: null,
            friendlySubtypeName: null,
          },
          {
            type: "bonus",
            subType: "hit-points",
            fixedValue: 4,
            value: null,
            friendlySubtypeName: null,
          },
        ],
      );
      expect(maxHp).toBe(108);
    });

    test("overrideHitPoints ignores HP modifier contributions", () => {
      const maxHp = normalizeMaxHp(
        { overrideHitPoints: 50 },
        baseAbilityScores,
        12,
        [
          {
            type: "bonus",
            subType: "hit-points-per-level",
            value: 1,
            fixedValue: null,
            friendlySubtypeName: null,
          },
        ],
      );
      expect(maxHp).toBe(50);
    });
  });

  describe("normalizeMaxHp + normalizeCurrentHp combined", () => {
    test("prefers override values for hit points", () => {
      const maxHp = normalizeMaxHp(
        { overrideHitPoints: 44 },
        baseAbilityScores,
        12,
        [],
      );
      const hp = normalizeCurrentHp({ currentHitPoints: 31 }, maxHp);
      expect(maxHp).toBe(44);
      expect(hp).toBe(31);
    });
  });
});
