import {
  validateMonsterUploadDocument,
  MonsterUploadDocument,
} from "@/lib/validation/monsterUpload";

const expectDocumentValid = (document: MonsterUploadDocument) => {
  const result = validateMonsterUploadDocument(document);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
};

const expectDocumentInvalid = (document: any, expectedMessage?: string) => {
  const result = validateMonsterUploadDocument(document);
  expect(result.valid).toBe(false);
  if (expectedMessage) {
    expect(result.errors[0].message).toContain(expectedMessage);
  }
};

describe("validateMonsterUploadDocument", () => {
  it("should reject document without monsters array", () => {
    const result = validateMonsterUploadDocument({ data: [] } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("monsters");
  });

  it("should reject document with empty monsters array", () => {
    expectDocumentInvalid({ monsters: [] }, "at least one");
  });

  it("should accept valid single monster document", () => {
    expectDocumentValid({ monsters: [{ name: "Goblin", maxHp: 7 }] });
  });

  it("should accept valid multi-monster document", () => {
    expectDocumentValid({
      monsters: [
        { name: "Goblin", maxHp: 7 },
        { name: "Hobgoblin", maxHp: 11 },
        { name: "Bugbear", maxHp: 27 },
      ],
    });
  });

  it("should collect errors from all invalid monsters", () => {
    const result = validateMonsterUploadDocument({
      monsters: [
        { name: "", maxHp: -1 },
        { name: "Hobgoblin" }, // missing maxHp
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
