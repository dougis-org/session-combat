import { normalizeSenses } from "@/lib/import/dndBeyond-skills-senses";

describe("dndBeyond-skills-senses", () => {
  describe("normalizeSenses", () => {
    test("omits speed when walk speed is 0 and defaults passive senses from ability modifiers", () => {
      // walk=0 → speed omitted; no proficiency in insight/investigation
      // passive insight = 10 + wis mod (0) = 10
      // passive investigation = 10 + int mod (3) = 13
      const data = {
        race: { weightSpeeds: { normal: { walk: 0 } } },
      };
      const abilityScores = {
        strength: 10,
        dexterity: 17,
        constitution: 14,
        intelligence: 16,
        wisdom: 10,
        charisma: 21,
      };
      const skills = { insight: 0, investigation: 3 };
      const senses = normalizeSenses(data, [], skills, abilityScores);

      expect(senses.speed).toBeUndefined();
      expect(senses["passive insight"]).toBe("10");
      expect(senses["passive investigation"]).toBe("13");
    });
  });
});
