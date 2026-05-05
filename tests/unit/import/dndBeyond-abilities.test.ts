import {
  normalizeAbilities,
  ACTIONS_BY_ACTIVATION_TYPE,
  TRAIT_TITLE_MAP,
  NOTE_TITLE_MAP,
  type DndBeyondActionEntry,
} from "../../../lib/import/dndBeyond-abilities";
import { CreatureAbility } from "../../../lib/types";

describe("dndBeyond-abilities", () => {
  describe("normalizeAbilities", () => {
    it("should categorize actions by activation type", () => {
      const actions = {
        action: [
          {
            name: "Attack",
            snippet: "Make a melee attack",
            activation: { activationType: 1 },
          },
        ],
        bonusAction: [
          {
            name: "Bonus Attack",
            snippet: "Use bonus action",
            activation: { activationType: 3 },
          },
        ],
        reaction: [
          {
            name: "Reaction Attack",
            snippet: "Use reaction",
            activation: { activationType: 4 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].name).toBe("Attack");

      expect(result.bonusActions).toHaveLength(1);
      expect(result.bonusActions[0].name).toBe("Bonus Attack");

      expect(result.reactions).toHaveLength(1);
      expect(result.reactions[0].name).toBe("Reaction Attack");

      expect(result.traits).toHaveLength(0);
    });

    it("should handle null/undefined inputs gracefully", () => {
      const result = normalizeAbilities(null, undefined, null);

      expect(result.actions).toEqual([]);
      expect(result.bonusActions).toEqual([]);
      expect(result.reactions).toEqual([]);
      expect(result.traits).toEqual([]);
    });

    it("should map traits with title map", () => {
      const traits = {
        personalityTraits: "I like gold",
        ideals: "Charity",
        bonds: null,
        flaws: "  ",
      };

      const result = normalizeAbilities(null, traits, null);

      expect(result.traits).toHaveLength(2);
      expect(result.traits[0].name).toBe("Personality Traits");
      expect(result.traits[0].description).toBe("I like gold");
      expect(result.traits[1].name).toBe("Ideals");
      expect(result.traits[1].description).toBe("Charity");
    });

    it("should map notes with title map", () => {
      const notes = {
        backstory: "Once a knight",
        allies: "The party",
      };

      const result = normalizeAbilities(null, null, notes);

      expect(result.traits).toHaveLength(2);
      expect(result.traits[0].name).toBe("Backstory");
      expect(result.traits[0].description).toBe("Once a knight");
      expect(result.traits[1].name).toBe("Allies");
      expect(result.traits[1].description).toBe("The party");
    });

    it("should combine traits and notes", () => {
      const traits = {
        personalityTraits: "Cheerful",
      };
      const notes = {
        backstory: "From a farm",
      };

      const result = normalizeAbilities(null, traits, notes);

      expect(result.traits).toHaveLength(2);
      expect(result.traits.map((t) => t.name)).toContain("Personality Traits");
      expect(result.traits.map((t) => t.name)).toContain("Backstory");
    });

    it("should sanitize HTML in action descriptions", () => {
      const actions = {
        action: [
          {
            name: "Fireball",
            snippet: "<p>Damage: <strong>8d6</strong></p>",
            activation: { activationType: 1 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].description).toBe("Damage: 8d6");
    });

    it("should filter out invalid actions (missing name)", () => {
      const actions = {
        action: [
          {
            name: null,
            snippet: "Valid snippet",
            activation: { activationType: 1 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions).toHaveLength(0);
    });

    it("should filter out actions with no description", () => {
      const actions = {
        action: [
          {
            name: "Attack",
            snippet: null,
            description: null,
            activation: { activationType: 1 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions).toHaveLength(0);
    });

    it("should filter out actions with only HTML (no text content)", () => {
      const actions = {
        action: [
          {
            name: "Attack",
            snippet: "<p></p>",
            activation: { activationType: 1 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions).toHaveLength(0);
    });

    it("should use snippet over description", () => {
      const actions = {
        action: [
          {
            name: "Attack",
            snippet: "Snippet content",
            description: "Description content",
            activation: { activationType: 1 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions[0].description).toBe("Snippet content");
    });

    it("should use description when snippet is not available", () => {
      const actions = {
        action: [
          {
            name: "Attack",
            snippet: null,
            description: "Description content",
            activation: { activationType: 1 },
          },
        ],
      };

      const result = normalizeAbilities(actions, null, null);

      expect(result.actions[0].description).toBe("Description content");
    });
  });

  describe("ACTIONS_BY_ACTIVATION_TYPE", () => {
    it("should map activationType 3 to bonusActions", () => {
      expect(ACTIONS_BY_ACTIVATION_TYPE[3]).toBe("bonusActions");
    });

    it("should map activationType 4 to reactions", () => {
      expect(ACTIONS_BY_ACTIVATION_TYPE[4]).toBe("reactions");
    });

    it("should not have mapping for activationType 1", () => {
      expect(ACTIONS_BY_ACTIVATION_TYPE[1]).toBeUndefined();
    });
  });

  describe("TRAIT_TITLE_MAP", () => {
    it("should contain all expected trait keys", () => {
      const expectedKeys = ["personalityTraits", "ideals", "bonds", "flaws", "appearance"];
      expectedKeys.forEach((key) => {
        expect(TRAIT_TITLE_MAP).toHaveProperty(key);
      });
    });

    it("should have humanized values", () => {
      expect(TRAIT_TITLE_MAP.personalityTraits).toBe("Personality Traits");
      expect(TRAIT_TITLE_MAP.ideals).toBe("Ideals");
      expect(TRAIT_TITLE_MAP.bonds).toBe("Bonds");
      expect(TRAIT_TITLE_MAP.flaws).toBe("Flaws");
      expect(TRAIT_TITLE_MAP.appearance).toBe("Appearance");
    });
  });

  describe("NOTE_TITLE_MAP", () => {
    it("should contain all expected note keys", () => {
      const expectedKeys = ["backstory", "allies", "enemies", "organizations", "otherNotes"];
      expectedKeys.forEach((key) => {
        expect(NOTE_TITLE_MAP).toHaveProperty(key);
      });
    });

    it("should have humanized values", () => {
      expect(NOTE_TITLE_MAP.backstory).toBe("Backstory");
      expect(NOTE_TITLE_MAP.allies).toBe("Allies");
      expect(NOTE_TITLE_MAP.enemies).toBe("Enemies");
      expect(NOTE_TITLE_MAP.organizations).toBe("Organizations");
      expect(NOTE_TITLE_MAP.otherNotes).toBe("Other Notes");
    });
  });

  describe("Full integration", () => {
    it("should normalize a complete character set", () => {
      const actions = {
        action: [
          {
            name: "Longsword",
            snippet: "Melee attack",
            activation: { activationType: 1 },
          },
        ],
        bonusAction: [
          {
            name: "Dash",
            snippet: "Move 30 feet",
            activation: { activationType: 3 },
          },
        ],
      };

      const traits = {
        personalityTraits: "Brave",
        ideals: "Justice",
      };

      const notes = {
        backstory: "Born in the mountains",
      };

      const result = normalizeAbilities(actions, traits, notes);

      expect(result.actions).toHaveLength(1);
      expect(result.bonusActions).toHaveLength(1);
      expect(result.reactions).toHaveLength(0);
      expect(result.traits).toHaveLength(3); // 2 traits + 1 note
    });
  });
});
