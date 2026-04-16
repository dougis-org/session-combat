import {
  validateMonsterUploadDocument,
  transformMonsterData,
  MonsterUploadDocument,
  RawMonsterData,
} from "@/lib/validation/monsterUpload";

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

    const monsters: RawMonsterData[] = (document.monsters || []) as RawMonsterData[];
    const transformed = monsters.map((m: RawMonsterData) =>
      transformMonsterData(m, "test-user"),
    );

    expect(transformed).toHaveLength(2);
    expect(transformed[0].name).toBe("Goblin");
    expect(transformed[1].name).toBe("Bugbear");
    expect(transformed.every((m) => m.userId === "test-user")).toBe(true);
  });

  it("should pass validation and allow transformation for minimal monster data", () => {
    const document: MonsterUploadDocument = {
      monsters: [
        {
          name: "Goblin",
          maxHp: 7,
        },
      ],
    };

    const validation = validateMonsterUploadDocument(document);
    expect(validation.valid).toBe(true);

    const monsters: RawMonsterData[] = (document.monsters || []) as RawMonsterData[];
    const transformed = transformMonsterData(monsters[0], "test-user");
    expect(transformed.name).toBe("Goblin");
  });
});
