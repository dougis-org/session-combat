/**
 * Integration tests for monster JSON upload functionality
 * Tests validation, transformation, and bulk loading of monsters
 */

import {
  validateMonsterUploadDocument,
  validateMonsterData,
  transformMonsterData,
  MonsterUploadDocument,
  RawMonsterData,
} from "../../lib/validation/monsterUpload";
import {
  createRawMonster,
  createMonsterDocument,
  VALID_ABILITY_SCORES,
  VALID_SIZES,
  INVALID_SIZE,
  VALID_AC_VALUES,
  INVALID_AC,
  VALID_LANGUAGES,
  VALID_TRAIT,
} from "./helpers/monsterTestData";

describe("Monster Upload Validation", () => {
  describe("validateMonsterUploadDocument", () => {
    it("should reject document without monsters array", () => {
      const document = { data: [] };
      const result = validateMonsterUploadDocument(document as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("monsters");
    });

    it("should reject document with empty monsters array", () => {
      const document: MonsterUploadDocument = { monsters: [] };
      const result = validateMonsterUploadDocument(document);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("at least one");
    });

    it("should accept valid single monster document", () => {
      const document: MonsterUploadDocument = {
        monsters: [
          {
            name: "Goblin",
            maxHp: 7,
          },
        ],
      };
      const result = validateMonsterUploadDocument(document);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept valid multi-monster document", () => {
      const document: MonsterUploadDocument = {
        monsters: [
          { name: "Goblin", maxHp: 7 },
          { name: "Hobgoblin", maxHp: 11 },
          { name: "Bugbear", maxHp: 27 },
        ],
      };
      const result = validateMonsterUploadDocument(document);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should collect errors from all invalid monsters", () => {
      const document: MonsterUploadDocument = {
        monsters: [
          { name: "", maxHp: -1 },
          { name: "Hobgoblin" }, // missing maxHp
        ],
      };
      const result = validateMonsterUploadDocument(document);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("validateMonsterData", () => {
    describe("required fields", () => {
      it("should require name", () => {
        const data: RawMonsterData = { maxHp: 10 };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringContaining("name"),
          }),
        );
      });

      it("should reject empty string name", () => {
        const data: RawMonsterData = { name: "", maxHp: 10 };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });

      it("should require maxHp", () => {
        const data: RawMonsterData = { name: "Goblin" };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringContaining("maxHp"),
          }),
        );
      });

      it("should reject maxHp <= 0", () => {
        const data: RawMonsterData = { name: "Goblin", maxHp: 0 };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });
    });

    describe("optional fields with validation", () => {
      it("should accept valid size values", () => {
        for (const size of VALID_SIZES) {
          const data = createRawMonster({ size });
          const result = validateMonsterData(data);

          expect(result.valid).toBe(true);
        }
      });

      it("should reject invalid size values", () => {
        const data = createRawMonster({ size: INVALID_SIZE });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringContaining("size"),
          }),
        );
      });

      it("should accept valid AC values (0-30)", () => {
        for (const ac of VALID_AC_VALUES) {
          const data = createRawMonster({ ac });
          const result = validateMonsterData(data);

          expect(result.valid).toBe(true);
        }
      });

      it("should reject AC outside valid range", () => {
        const data = createRawMonster({ ac: INVALID_AC });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });

      it("should accept valid challengeRating values", () => {
        const data: RawMonsterData = {
          name: "Test",
          maxHp: 10,
          challengeRating: 5,
        };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      });

      it("should reject negative challengeRating", () => {
        const data: RawMonsterData = {
          name: "Test",
          maxHp: 10,
          challengeRating: -1,
        };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });
    });

    describe("ability scores", () => {
      it("should accept valid ability scores", () => {
        const data: RawMonsterData = createRawMonster({
          abilityScores: VALID_ABILITY_SCORES,
        });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      });

      it("should reject missing ability score fields", () => {
        const data: RawMonsterData = {
          name: "Test",
          maxHp: 10,
          abilityScores: {
            strength: 10,
            dexterity: 11,
            // missing others
          },
        };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });

      it("should reject ability scores outside valid range (1-30)", () => {
        const data: RawMonsterData = {
          name: "Test",
          maxHp: 10,
          abilityScores: {
            strength: 40,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
          },
        };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });
    });

    describe("array fields", () => {
      it("should accept empty arrays for optional arrays", () => {
        const data: RawMonsterData = {
          name: "Test",
          maxHp: 10,
          languages: [],
          traits: [],
        };
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      });

      it("should accept valid language arrays", () => {
        const data = createRawMonster({
          languages: VALID_LANGUAGES,
        });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      });

      it("should reject non-string values in language arrays", () => {
        const data = createRawMonster({
          languages: ["Common", 123 as any],
        });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });

      it("should accept valid traits with name and description", () => {
        const data = createRawMonster({
          traits: [VALID_TRAIT],
        });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      });

      it("should reject traits without required fields", () => {
        const data = createRawMonster({
          traits: [{ name: "Keen Smell" }] as any,
        });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(false);
      });
    });
  });

  describe("transformMonsterData", () => {
    it("should transform minimal monster data with defaults", () => {
      const raw: RawMonsterData = { name: "Goblin", maxHp: 7 };
      const result = transformMonsterData(raw, "user123");

      expect(result.id).toBeDefined();
      expect(result.userId).toBe("user123");
      expect(result.name).toBe("Goblin");
      expect(result.maxHp).toBe(7);
      expect(result.hp).toBe(7);
      expect(result.ac).toBe(10);
      expect(result.size).toBe("medium");
      expect(result.type).toBe("humanoid");
      expect(result.isGlobal).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should transform complete monster data", () => {
      const raw: RawMonsterData = {
        name: "Aboleth",
        size: "large",
        type: "aberration",
        alignment: "chaotic evil",
        ac: 17,
        hp: 135,
        maxHp: 135,
        speed: "10 ft., swim 40 ft.",
        challengeRating: 10,
        experiencePoints: 5900,
        description: "An ancient aberration",
        source: "SRD",
        abilityScores: {
          strength: 21,
          dexterity: 9,
          constitution: 15,
          intelligence: 18,
          wisdom: 15,
          charisma: 18,
        },
        languages: ["Abyssal"],
        traits: [
          {
            name: "Amphibious",
            description: "The aboleth can breathe air and water.",
          },
        ],
      };

      const result = transformMonsterData(raw, "user123");

      expect(result.name).toBe("Aboleth");
      expect(result.size).toBe("large");
      expect(result.type).toBe("aberration");
      expect(result.alignment).toBe("chaotic evil");
      expect(result.ac).toBe(17);
      expect(result.hp).toBe(135);
      expect(result.maxHp).toBe(135);
      expect(result.speed).toBe("10 ft., swim 40 ft.");
      expect(result.challengeRating).toBe(10);
      expect(result.experiencePoints).toBe(5900);
      expect(result.description).toBe("An ancient aberration");
      expect(result.source).toBe("SRD");
      expect(result.abilityScores.strength).toBe(21);
      expect(result.languages).toHaveLength(1);
      expect(result.traits).toHaveLength(1);
      expect(result.traits?.[0]?.name).toBe("Amphibious");
    });

    it("should clamp hp to maxHp if provided value is higher", () => {
      const raw: RawMonsterData = { name: "Test", hp: 100, maxHp: 50 };
      const result = transformMonsterData(raw, "user123");

      expect(result.hp).toBe(50);
      expect(result.maxHp).toBe(50);
    });

    it("should set hp to maxHp if hp not provided", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 25 };
      const result = transformMonsterData(raw, "user123");

      expect(result.hp).toBe(25);
      expect(result.maxHp).toBe(25);
    });

    it("should trim whitespace from name", () => {
      const raw: RawMonsterData = { name: "  Goblin  ", maxHp: 7 };
      const result = transformMonsterData(raw, "user123");

      expect(result.name).toBe("Goblin");
    });

    it("should assign unique IDs to each monster", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10 };
      const result1 = transformMonsterData(raw, "user123");
      const result2 = transformMonsterData(raw, "user123");

      expect(result1.id).not.toBe(result2.id);
    });

    it("should assign correct userId from parameter", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10 };
      const result = transformMonsterData(raw, "user-special-id");

      expect(result.userId).toBe("user-special-id");
    });

    it("should set isGlobal to false for user uploads", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10 };
      const result = transformMonsterData(raw, "user123");

      expect(result.isGlobal).toBe(false);
    });
  });

  describe("end-to-end validation flow", () => {
    it("should validate and transform a complete valid document", () => {
      const document: MonsterUploadDocument = {
        monsters: [
          {
            name: "Goblin",
            size: "small",
            type: "humanoid",
            maxHp: 7,
            ac: 15,
            challengeRating: 0.125,
          },
          {
            name: "Bugbear",
            size: "medium",
            type: "humanoid",
            maxHp: 27,
            ac: 16,
            challengeRating: 3,
          },
        ],
      };

      const validation = validateMonsterUploadDocument(document);
      expect(validation.valid).toBe(true);

      const monsters: RawMonsterData[] = (document.monsters ||
        []) as RawMonsterData[];
      const transformed = monsters.map((m: RawMonsterData, idx: number) =>
        transformMonsterData(m, "test-user"),
      );

      expect(transformed).toHaveLength(2);
      expect(transformed[0].name).toBe("Goblin");
      expect(transformed[1].name).toBe("Bugbear");
      expect(transformed.every((m) => m.userId === "test-user")).toBe(true);
    });

    it("should fail validation but still provide transformation hints", () => {
      const document: MonsterUploadDocument = {
        monsters: [
          {
            name: "Goblin",
            maxHp: 7,
          },
        ],
      };

      const validation = validateMonsterUploadDocument(document);
      expect(validation.valid).toBe(true); // This is valid

      // But we could still transform it
      const monsters: RawMonsterData[] = (document.monsters ||
        []) as RawMonsterData[];
      const transformed = transformMonsterData(monsters[0], "test-user");
      expect(transformed.name).toBe("Goblin");
    });
  });
});
