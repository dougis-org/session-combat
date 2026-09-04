import {
  validateMonsterUploadDocument,
  transformMonsterData,
  RawMonsterData,
} from "@/lib/validation/monsterUpload";

const ABILITY_SCORES = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const validMonster = (overrides?: Partial<RawMonsterData>): RawMonsterData => ({
  name: "Goblin",
  size: "small",
  type: "humanoid",
  ac: 15,
  maxHp: 7,
  speed: "30 ft.",
  challengeRating: 0.125,
  abilityScores: { ...ABILITY_SCORES },
  ...overrides,
});

const personal = { userId: "test-user", isGlobal: false };

describe("end-to-end validation flow", () => {
  it("should validate and transform a complete valid document", () => {
    const document = {
      monsters: [
        validMonster({ name: "Goblin" }),
        validMonster({ name: "Bugbear", maxHp: 27, ac: 16, challengeRating: 3, size: "medium" }),
      ],
    };

    const validation = validateMonsterUploadDocument(document);
    expect(validation.valid).toBe(true);

    const monsters = document.monsters as RawMonsterData[];
    const transformed = monsters.map((m) => transformMonsterData(m, personal));

    expect(transformed).toHaveLength(2);
    expect(transformed[0].name).toBe("Goblin");
    expect(transformed[1].name).toBe("Bugbear");
    expect(transformed.every((m) => m.userId === "test-user")).toBe(true);
  });

  it("accepts a bare top-level array and transforms it", () => {
    const monsters = [validMonster()];

    const validation = validateMonsterUploadDocument(monsters);
    expect(validation.valid).toBe(true);

    const transformed = transformMonsterData(monsters[0], personal);
    expect(transformed.name).toBe("Goblin");
  });
});
