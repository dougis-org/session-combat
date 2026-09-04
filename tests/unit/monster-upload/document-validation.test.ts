import {
  validateMonsterUploadDocument,
  RawMonsterData,
} from "@/lib/validation/monsterUpload";

const validMonster = (overrides?: Partial<RawMonsterData>): RawMonsterData => ({
  name: "Goblin",
  size: "small",
  type: "humanoid",
  ac: 15,
  maxHp: 7,
  speed: "30 ft.",
  challengeRating: 0.25,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  ...overrides,
});

const expectDocumentValid = (document: unknown) => {
  const result = validateMonsterUploadDocument(document);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
};

const expectDocumentInvalid = (document: unknown, expectedMessage?: string) => {
  const result = validateMonsterUploadDocument(document);
  expect(result.valid).toBe(false);
  if (expectedMessage) {
    expect(result.errors[0].message).toContain(expectedMessage);
  }
};

describe("validateMonsterUploadDocument", () => {
  it("should reject document without monsters array", () => {
    const result = validateMonsterUploadDocument({ data: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("monsters");
  });

  it("should reject document with empty monsters array", () => {
    expectDocumentInvalid({ monsters: [] }, "at least one");
  });

  it("should accept a bare top-level array", () => {
    expectDocumentValid([validMonster()]);
  });

  it("should accept a { monsters: [...] } wrapper equivalently", () => {
    expectDocumentValid({ monsters: [validMonster()] });
  });

  it("should accept valid multi-monster document", () => {
    expectDocumentValid({
      monsters: [
        validMonster({ name: "Goblin" }),
        validMonster({ name: "Hobgoblin", maxHp: 11 }),
        validMonster({ name: "Bugbear", maxHp: 27 }),
      ],
    });
  });

  it("should collect errors from all invalid monsters", () => {
    const result = validateMonsterUploadDocument({
      monsters: [
        { name: "", maxHp: -1 },
        { name: "Hobgoblin" }, // missing many required fields
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts a document at the maximum monster count (1000)", () => {
    const monsters = Array.from({ length: 1000 }, (_, i) =>
      validMonster({ name: `Monster ${i}` }),
    );
    expectDocumentValid({ monsters });
  });

  it("rejects a document over the maximum monster count (1001)", () => {
    const monsters = Array.from({ length: 1001 }, (_, i) =>
      validMonster({ name: `Monster ${i}` }),
    );
    expectDocumentInvalid({ monsters }, "at most 1000");
  });

  it("should report a missing required field by monsters[i].field path", () => {
    const monsters = [
      validMonster(),
      validMonster(),
      validMonster(),
      validMonster(),
    ];
    delete (monsters[3] as Record<string, unknown>).abilityScores;

    const result = validateMonsterUploadDocument({ monsters });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: "monsters[3].abilityScores" }),
    );
  });
});
