import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const {
  normalizeType,
  getCRExperience,
  transformMonster,
  generateTypeFile,
} = require("../../../../lib/scripts/populateMonstersByType");

describe("normalizeType", () => {
  it("converts swarm type to beast", () => {
    expect(normalizeType("swarm of Tiny beasts")).toBe("beast");
  });

  it("converts mixed-case swarm to beast", () => {
    expect(normalizeType("Swarm of Medium Undead")).toBe("beast");
  });

  it("lowercases a standard type", () => {
    expect(normalizeType("Humanoid")).toBe("humanoid");
  });

  it("leaves already-lowercase type unchanged", () => {
    expect(normalizeType("undead")).toBe("undead");
  });
});

describe("getCRExperience", () => {
  it("returns 10 for CR 0", () => {
    expect(getCRExperience(0)).toBe(10);
  });

  it("returns 100 for CR 0.5", () => {
    expect(getCRExperience(0.5)).toBe(100);
  });

  it("returns 200 for CR 1", () => {
    expect(getCRExperience(1)).toBe(200);
  });

  it("returns 25000 for CR 20", () => {
    expect(getCRExperience(20)).toBe(25000);
  });

  it("returns 0 for unknown CR", () => {
    expect(getCRExperience(99)).toBe(0);
  });
});

const FULL_MONSTER = {
  name: "Goblin",
  type: "Humanoid",
  size: "Small",
  alignment: "Neutral Evil",
  armor_class: [{ value: 15, type: "leather armor" }],
  hit_points: 7,
  hit_dice: "2d6",
  speed: { walk: "30 ft." },
  strength: 8,
  dexterity: 14,
  constitution: 10,
  intelligence: 10,
  wisdom: 8,
  charisma: 8,
  proficiencies: [
    { proficiency: { name: "Saving Throw: Dex" }, value: 4 },
    { proficiency: { name: "Skill: Stealth" }, value: 6 },
  ],
  senses: { darkvision: "60 ft.", passive_perception: 9 },
  languages: "Common, Goblin",
  challenge_rating: 0.25,
  xp: 50,
  special_abilities: [{ name: "Nimble Escape", desc: "Can Disengage or Hide as bonus action." }],
  actions: [
    {
      name: "Scimitar",
      desc: "Melee attack",
      attack_bonus: 4,
      damage: [{ damage_dice: "1d6+2", damage_type: { name: "Slashing" } }],
    },
  ],
};

describe("transformMonster", () => {
  it("maps a full fixture correctly", () => {
    const result = transformMonster(FULL_MONSTER);
    expect(result.name).toBe("Goblin");
    expect(result.ac).toBe(15);
    expect(result.hp).toBe(7);
    expect(result.abilities).toMatchObject({ strength: 8, dexterity: 14 });
    expect(result.savingThrows).toMatchObject({ dex: 4 });
    expect(result.skills).toMatchObject({ stealth: 6 });
    expect(result.actions).toHaveLength(1);
    expect(result.traits).toHaveLength(1);
    expect(result.source).toBe("SRD");
    expect(result.experiencePoints).toBe(50);
  });

  it("omits savingThrows and skills when proficiencies is empty", () => {
    const result = transformMonster({ ...FULL_MONSTER, proficiencies: [] });
    expect(result).not.toHaveProperty("savingThrows");
    expect(result).not.toHaveProperty("skills");
  });

  it("sets senses to empty string when senses is null", () => {
    const result = transformMonster({ ...FULL_MONSTER, senses: null });
    expect(result.senses).toBe("");
  });

  it("sets senses to empty string when senses is absent", () => {
    const { senses: _senses, ...noSenses } = FULL_MONSTER;
    const result = transformMonster(noSenses);
    expect(result.senses).toBe("");
  });

  it("omits actions when actions is empty", () => {
    const result = transformMonster({ ...FULL_MONSTER, actions: [] });
    expect(result).not.toHaveProperty("actions");
  });

  it("uses getCRExperience when xp is absent", () => {
    const { xp: _xp, ...noXp } = FULL_MONSTER;
    const result = transformMonster({ ...noXp, challenge_rating: 5 });
    expect(result.experiencePoints).toBe(1800);
  });

  it("maps conditionImmunities array of objects to name strings", () => {
    const result = transformMonster({
      ...FULL_MONSTER,
      condition_immunities: [{ name: "Charmed" }, { name: "Frightened" }],
    });
    expect(result.conditionImmunities).toEqual(["Charmed", "Frightened"]);
  });

  it("includes saveDC and saveType on action with dc", () => {
    const monsterWithDC = {
      ...FULL_MONSTER,
      actions: [
        {
          name: "Bite",
          desc: "Bite attack with save",
          dc: { dc_value: 12, dc_type: { name: "Strength" } },
        },
      ],
    };
    const result = transformMonster(monsterWithDC);
    expect(result.actions[0].saveDC).toBe(12);
    expect(result.actions[0].saveType).toBe("Strength");
  });
});

describe("generateTypeFile", () => {
  let tmpDir: string;
  let fileContent: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "monsters-test-"));
    generateTypeFile("beast", [], tmpDir);
    fileContent = fs.readFileSync(path.join(tmpDir, "beasts.ts"), "utf8");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a file in the specified directory", () => {
    expect(fs.existsSync(path.join(tmpDir, "beasts.ts"))).toBe(true);
  });

  it("file content contains correct export name", () => {
    expect(fileContent).toContain("export const BEASTS:");
  });

  it("file content contains MonsterTemplate import", () => {
    expect(fileContent).toContain("import { MonsterTemplate } from");
  });
});
