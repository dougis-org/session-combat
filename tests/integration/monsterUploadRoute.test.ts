/**
 * Integration tests for monster upload API endpoint
 * Tests the POST /api/monsters/upload route with valid and invalid data
 */

import { validateMonsterUploadDocument } from '../../lib/validation/monsterUpload';

describe('Monster Upload Route Integration', () => {
  describe('Route Validation', () => {
    it('should validate document structure before processing', () => {
      const validMonster = {
        monsters: [
          {
            name: 'Test Monster',
            maxHp: 50,
            size: 'medium',
            type: 'humanoid',
          },
        ],
      };

      const result = validateMonsterUploadDocument(validMonster);
      expect(result.valid).toBe(true);
    });

    it('should reject documents without monsters array', () => {
      const invalidDocument = { invalid: 'structure' };
      const result = validateMonsterUploadDocument(invalidDocument as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty monsters array', () => {
      const emptyDocument = { monsters: [] };
      const result = validateMonsterUploadDocument(emptyDocument);

      expect(result.valid).toBe(false);
    });

    it('should reject invalid monster data', () => {
      const invalidMonster = {
        monsters: [
          {
            // Missing required 'name' and 'maxHp'
            size: 'medium',
          },
        ],
      };

      const result = validateMonsterUploadDocument(invalidMonster as any);
      expect(result.valid).toBe(false);
    });

    it('should accept valid monster with all required fields', () => {
      const validDocument = {
        monsters: [
          {
            name: 'Dragon',
            maxHp: 200,
            size: 'huge',
            type: 'dragon',
            ac: 19,
            alignement: 'chaotic evil',
          },
        ],
      };

      const result = validateMonsterUploadDocument(validDocument as any);
      expect(result.valid).toBe(true);
    });

    it('should accept multiple monsters in single document', () => {
      const multiMonsterDoc = {
        monsters: [
          { name: 'Monster 1', maxHp: 50, size: 'medium', type: 'humanoid' },
          { name: 'Monster 2', maxHp: 75, size: 'large', type: 'beast' },
          { name: 'Monster 3', maxHp: 100, size: 'huge', type: 'dragon' },
        ],
      };

      const result = validateMonsterUploadDocument(multiMonsterDoc as any);
      expect(result.valid).toBe(true);
    });

    it('should validate monster fields independently', () => {
      const mixedValidityDoc = {
        monsters: [
          { name: 'Valid Monster', maxHp: 50, size: 'medium', type: 'humanoid' },
          { maxHp: 75 }, // Missing name
          { name: 'Another', maxHp: -5 }, // Invalid HP
        ],
      };

      const result = validateMonsterUploadDocument(mixedValidityDoc as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept optional fields', () => {
      const minimalMonster = {
        monsters: [
          {
            name: 'Minimal Monster',
            maxHp: 1,
          },
        ],
      };

      const result = validateMonsterUploadDocument(minimalMonster as any);
      expect(result.valid).toBe(true);
    });
  });

  describe('Field-Specific Validation', () => {
    it('should reject AC outside valid range', () => {
      const invalidAC = {
        monsters: [
          {
            name: 'Bad AC Monster',
            maxHp: 50,
            ac: 50, // Invalid, should be 0-30
          },
        ],
      };

      const result = validateMonsterUploadDocument(invalidAC as any);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid monster size', () => {
      const invalidSize = {
        monsters: [
          {
            name: 'Bad Size Monster',
            maxHp: 50,
            size: 'enormous', // Not a valid D&D size
          },
        ],
      };

      const result = validateMonsterUploadDocument(invalidSize as any);
      expect(result.valid).toBe(false);
    });

    it('should accept valid D&D sizes', () => {
      const sizes = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

      for (const size of sizes) {
        const doc = {
          monsters: [
            {
              name: `${size} Monster`,
              maxHp: 50,
              size,
            },
          ],
        };

        const result = validateMonsterUploadDocument(doc as any);
        expect(result.valid).toBe(true);
      }
    });

    it('should validate ability scores in valid range', () => {
      const validAbilities = {
        monsters: [
          {
            name: 'Good Stats',
            maxHp: 50,
            abilityScores: {
              strength: 15,
              dexterity: 12,
              constitution: 14,
              intelligence: 10,
              wisdom: 13,
              charisma: 11,
            },
          },
        ],
      };

      const result = validateMonsterUploadDocument(validAbilities as any);
      expect(result.valid).toBe(true);
    });

    it('should reject ability scores outside range', () => {
      const invalidAbilities = {
        monsters: [
          {
            name: 'Bad Stats',
            maxHp: 50,
            abilityScores: {
              strength: 50, // Too high
              dexterity: 12,
              constitution: 0, // Too low
              intelligence: 10,
              wisdom: 13,
              charisma: 11,
            },
          },
        ],
      };

      const result = validateMonsterUploadDocument(invalidAbilities as any);
      expect(result.valid).toBe(false);
    });
  });
});
