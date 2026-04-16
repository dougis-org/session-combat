import {
  validateMonsterUploadDocument,
  MonsterUploadDocument,
} from "@/lib/validation/monsterUpload";

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
