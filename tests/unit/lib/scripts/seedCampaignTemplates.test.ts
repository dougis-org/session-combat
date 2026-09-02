import { runCli, handleCliError, seedCampaignTemplates } from "../../../../lib/scripts/seedCampaignTemplates";
import { getDatabase } from "../../../../lib/db";
import { GLOBAL_USER_ID } from "../../../../lib/constants";
import { CUSTOM_MONSTERS } from "../../../../lib/data/customMonsters";

jest.mock("../../../../lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../../../lib/constants", () => ({
  GLOBAL_USER_ID: "GLOBAL",
}));

function makeCollection(existingDocs: Array<{name: string; userId: string}> = []) {
  return {
    findOne: jest.fn().mockImplementation(async (query: {name: string; userId: string}) => {
      return existingDocs.find(d => d.name === query.name && d.userId === query.userId) || null;
    }),
    insertOne: jest.fn().mockResolvedValue({ insertedId: "some-id" }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
}

function makeDb(existingDocs: Array<{name: string; userId: string}> = []) {
  return { collection: jest.fn().mockReturnValue(makeCollection(existingDocs)) };
}

describe("seedCampaignTemplates", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("inserts missing templates and skips existing ones", async () => {
    // Return one existing template (Curse of Strahd)
    (getDatabase as jest.Mock).mockResolvedValue(makeDb([{ name: "Curse of Strahd", userId: "GLOBAL" }]));

    const result = await seedCampaignTemplates();

    // Since there are 24 templates currently (approx), one is skipped, rest inserted.
    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.inserted).toBeGreaterThan(10);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping (exists): Curse of Strahd"));
  });

  it("force-updates existing templates when force=true", async () => {
    const mockDb = makeDb([{ name: "Curse of Strahd", userId: "GLOBAL" }]);
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    const col = mockDb.collection("campaignTemplates");

    const result = await seedCampaignTemplates({ force: true });

    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(col.updateOne).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Force updated: Curse of Strahd"));
  });

  it("returns zero updated when no templates exist and force=true", async () => {
    (getDatabase as jest.Mock).mockResolvedValue(makeDb());

    const result = await seedCampaignTemplates({ force: true });

    expect(result.updated).toBe(0);
    expect(result.inserted).toBeGreaterThan(0);
  });

  it("Vecna template has 11 chapters covering all of Eve of Ruin", async () => {
    (getDatabase as jest.Mock).mockResolvedValue(makeDb());

    let seededTemplate: any = null;
    const col = {
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockImplementation(async (doc: any) => {
        if (doc.name === "Vecna: Eve of Ruin") seededTemplate = doc;
        return { insertedId: "some-id" };
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    (getDatabase as jest.Mock).mockResolvedValue({ collection: jest.fn().mockReturnValue(col) });

    await seedCampaignTemplates();

    expect(seededTemplate).not.toBeNull();
    expect(seededTemplate.chapters).toHaveLength(11);
    // Each chapter has a unique title covering the 11 official chapters
    const titles = seededTemplate.chapters.map((c: { title: string }) => c.title);
    expect(titles).toContain("Return from Neverdeath Graveyard");
    expect(titles).toContain("Tomb of Wayward Souls");
    expect(titles).toContain("Eve of Ruin");
  });

  it("Vecna template encounters contain full Monster stat blocks, not empty arrays", async () => {
    (getDatabase as jest.Mock).mockResolvedValue(makeDb());

    let seededTemplate: any = null;
    const col = {
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockImplementation(async (doc: any) => {
        if (doc.name === "Vecna: Eve of Ruin") seededTemplate = doc;
        return { insertedId: "some-id" };
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    (getDatabase as jest.Mock).mockResolvedValue({ collection: jest.fn().mockReturnValue(col) });

    await seedCampaignTemplates();

    expect(seededTemplate.encounters.length).toBeGreaterThanOrEqual(11);
    let emptyEncounterCount = 0;
    for (const enc of seededTemplate.encounters) {
      if (!enc.monsters || enc.monsters.length === 0) emptyEncounterCount++;
      for (const monster of enc.monsters || []) {
        expect(monster.id).toBeDefined();
        expect(monster.name).toBeDefined();
        expect(monster.challengeRating).toBeDefined();
        expect(monster.abilityScores).toBeDefined();
        expect(monster.hp).toBeGreaterThan(0);
      }
    }
    expect(emptyEncounterCount).toBe(0);
  });

  it("Vecna encounter instances are uniquely id'd even when same stat block repeats", async () => {
    (getDatabase as jest.Mock).mockResolvedValue(makeDb());

    let seededTemplate: any = null;
    const col = {
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockImplementation(async (doc: any) => {
        if (doc.name === "Vecna: Eve of Ruin") seededTemplate = doc;
        return { insertedId: "some-id" };
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    (getDatabase as jest.Mock).mockResolvedValue({ collection: jest.fn().mockReturnValue(col) });

    await seedCampaignTemplates();

    // Every monster instance across all encounters must have a unique id
    const allIds = seededTemplate.encounters.flatMap((e: any) => e.monsters.map((m: any) => m.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

/**
 * Helper: run seedCampaignTemplates against an empty in-memory DB and capture
 * the seeded template for the campaign matching `name`.
 */
async function captureTemplate(name: string): Promise<any> {
  let seeded: any = null;
  const col = {
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockImplementation(async (doc: any) => {
      if (doc.name === name) seeded = doc;
      return { insertedId: "some-id" };
    }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
  (getDatabase as jest.Mock).mockResolvedValue({ collection: jest.fn().mockReturnValue(col) });
  await seedCampaignTemplates();
  return seeded;
}

/** Asserts the seeded campaign meets the shared encounter-quality contract. */
function assertCampaignEncounterContract(seeded: any, campaignName: string, expectedChapterCount: number) {
  expect(seeded).not.toBeNull();
  expect(seeded.chapters).toHaveLength(expectedChapterCount);
  expect(Array.isArray(seeded.encounters)).toBe(true);
  expect(seeded.encounters.length).toBeGreaterThan(0);
  let emptyEncounterCount = 0;
  for (const enc of seeded.encounters) {
    expect(enc.name).toBeDefined();
    expect(enc.description).toBeDefined();
    if (!enc.monsters || enc.monsters.length === 0) emptyEncounterCount++;
    for (const monster of enc.monsters || []) {
      expect(monster.id).toBeDefined();
      expect(monster.name).toBeDefined();
      expect(monster.challengeRating).toBeDefined();
      expect(monster.abilityScores).toBeDefined();
      expect(monster.hp).toBeGreaterThan(0);
    }
  }
  expect(emptyEncounterCount).toBe(0);
  const allIds = seeded.encounters.flatMap((e: any) => e.monsters.map((m: any) => m.id));
  expect(new Set(allIds).size).toBe(allIds.length);
}

describe("Curse of Strahd encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("CoS has 13 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Curse of Strahd");
    assertCampaignEncounterContract(seeded, "Curse of Strahd", 13);
  });
});

describe("Tomb of Annihilation encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ToA has 5 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Tomb of Annihilation");
    assertCampaignEncounterContract(seeded, "Tomb of Annihilation", 5);
  });
});

describe("Lost Mine of Phandelver encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("LMoP has 4 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Lost Mine of Phandelver");
    assertCampaignEncounterContract(seeded, "Lost Mine of Phandelver", 4);
  });
});

describe("Tyranny of Dragons encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ToD has 13 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Tyranny of Dragons");
    assertCampaignEncounterContract(seeded, "Tyranny of Dragons", 13);
  });
});

describe("Baldur's Gate: Descent into Avernus encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("BGDIA has 5 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Baldur's Gate: Descent into Avernus");
    assertCampaignEncounterContract(seeded, "Baldur's Gate: Descent into Avernus", 5);
  });
});

describe("Waterdeep: Dragon Heist encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("WDH has 9 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Waterdeep: Dragon Heist");
    assertCampaignEncounterContract(seeded, "Waterdeep: Dragon Heist", 9);
  });
});

describe("Storm King's Thunder encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("SKT has 10 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Storm King's Thunder");
    assertCampaignEncounterContract(seeded, "Storm King's Thunder", 10);
  });
});

describe("Out of the Abyss encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("OotA has 17 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Out of the Abyss");
    assertCampaignEncounterContract(seeded, "Out of the Abyss", 17);
  });
});

describe("Dragon of Icespire Peak encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("DIP has 4 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Dragon of Icespire Peak");
    assertCampaignEncounterContract(seeded, "Dragon of Icespire Peak", 4);
  });
});

describe("Phandelver and Below: The Shattered Obelisk encounters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("PaBtSO has 8 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Phandelver and Below: The Shattered Obelisk");
    assertCampaignEncounterContract(seeded, "Phandelver and Below: The Shattered Obelisk", 8);
  });
});

// ---------------------------------------------------------------------------
// populate-campaigns-g3 — per-campaign contract tests (Planar & non-Realms)
// Maps to openspec/changes/populate-campaigns-g3/specs/populate-campaigns-g3/spec.md
// ---------------------------------------------------------------------------

function allMonsters(seeded: any): any[] {
  return seeded.encounters.flatMap((e: any) => e.monsters || []);
}

describe("Icewind Dale: Rime of the Frostmaiden encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("Rime has 7 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Icewind Dale: Rime of the Frostmaiden");
    assertCampaignEncounterContract(seeded, "Icewind Dale: Rime of the Frostmaiden", 7);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(10);
    const auril = allMonsters(seeded).find((m) => m.name === "Auril, the Frostmaiden");
    expect(auril).toBeDefined();
    expect(auril.damageImmunities).toContain("cold");
    expect((auril.traits || []).some((t: any) => t.name === "Frost Aura")).toBe(true);
  });
});

describe("The Wild Beyond the Witchlight encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("WBtW has 5 chapters and encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("The Wild Beyond the Witchlight");
    assertCampaignEncounterContract(seeded, "The Wild Beyond the Witchlight", 5);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(8);
    const coven = ["Brigid Morningglow", "Mungoj Reyhorn", "Endelyn Moongrave", "Sister Gala"];
    const names = allMonsters(seeded).map((m) => m.name);
    for (const c of coven) expect(names).toContain(c);
    for (const c of coven) {
      const member = allMonsters(seeded).find((m) => m.name === c);
      expect(Array.isArray(member.legendaryActions)).toBe(true);
      expect(member.legendaryActions.length).toBeGreaterThan(0);
    }
  });
});

describe("Princes of the Apocalypse encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("PotA has 5 chapters and 20+ encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Princes of the Apocalypse");
    assertCampaignEncounterContract(seeded, "Princes of the Apocalypse", 5);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(20);
    const names = allMonsters(seeded).map((m) => m.name);
    for (const prince of ["Imix", "Ogrémoch", "Yuan-Tin", "Bane"]) {
      expect(names.some((n: string) => n.startsWith(prince))).toBe(true);
    }
    for (const ele of ["Air Elemental", "Earth Elemental", "Fire Elemental", "Water Elemental"]) {
      expect(names).toContain(ele);
    }
  });
});

describe("Curse of the Crimson Throne encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("CotCT has 6 chapters, encounters populated, 5e-conversion notes present", async () => {
    const seeded = await captureTemplate("Curse of the Crimson Throne");
    assertCampaignEncounterContract(seeded, "Curse of the Crimson Throne", 6);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(12);
    expect(allMonsters(seeded).map((m) => m.name)).toContain("Queen Ileosa Arabasti");
    expect(seeded.encounters.some((e: any) => e.description.includes("(5e conversion)"))).toBe(true);
  });
});

describe("Hell's Rebels encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("HR has 6 chapters, encounters populated, devil damage types canonical", async () => {
    const seeded = await captureTemplate("Hell's Rebels");
    assertCampaignEncounterContract(seeded, "Hell's Rebels", 6);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(12);
    expect(allMonsters(seeded).map((m) => m.name)).toContain("Barbaroscia Thrune");
    const canonical = new Set(["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"]);
    for (const mon of allMonsters(seeded)) {
      for (const arr of [mon.damageResistances, mon.damageImmunities, mon.damageVulnerabilities]) {
        for (const v of arr || []) expect(canonical.has(v)).toBe(true);
      }
    }
  });
});

describe("Red Hand of Doom encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("RHoD has 5 chapters and 15+ encounters with full Monster stat blocks", async () => {
    const seeded = await captureTemplate("Red Hand of Doom");
    assertCampaignEncounterContract(seeded, "Red Hand of Doom", 5);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(15);
    const names = allMonsters(seeded).map((m) => m.name);
    expect(names).toContain("Hurog Manthex");
    expect(names.some((n: string) => n.startsWith("Wyrmlord"))).toBe(true);
  });
});

describe("populate-campaigns-g3 failure mode", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("seeding does not silently produce empty encounter monster arrays for any G3 campaign", async () => {
    for (const name of [
      "Icewind Dale: Rime of the Frostmaiden",
      "The Wild Beyond the Witchlight",
      "Princes of the Apocalypse",
      "Curse of the Crimson Throne",
      "Hell's Rebels",
      "Red Hand of Doom",
    ]) {
      const seeded = await captureTemplate(name);
      for (const enc of seeded.encounters) expect(enc.monsters.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// populate-campaigns-g4 — Anthologies & Adventure Paths
// Maps to openspec/changes/populate-campaigns-g4/specs/populate-campaigns-g4/spec.md
// ---------------------------------------------------------------------------

const CANONICAL_DAMAGE_TYPES = new Set([
  "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
  "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
]);

function hasTemplate(seeded: any, templateId: string): boolean {
  return allMonsters(seeded).some((m) => m.templateId === templateId);
}

describe("populate-campaigns-g4 encounters", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("Candlekeep Mysteries: 17 chapters, one encounter per anthology adventure", async () => {
    const seeded = await captureTemplate("Candlekeep Mysteries");
    assertCampaignEncounterContract(seeded, "Candlekeep Mysteries", 17);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(17);
  });

  it("Journeys Through the Radiant Citadel: 13 chapters, encounters populated with canonical damage types", async () => {
    const seeded = await captureTemplate("Journeys Through the Radiant Citadel");
    assertCampaignEncounterContract(seeded, "Journeys Through the Radiant Citadel", 13);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(13);
    for (const mon of allMonsters(seeded)) {
      for (const arr of [mon.damageResistances, mon.damageImmunities, mon.damageVulnerabilities]) {
        for (const v of arr || []) expect(CANONICAL_DAMAGE_TYPES.has(v)).toBe(true);
      }
    }
  });

  it("Keys from the Golden Vault: 13 heist encounters, no empty monster arrays", async () => {
    const seeded = await captureTemplate("Keys from the Golden Vault");
    assertCampaignEncounterContract(seeded, "Keys from the Golden Vault", 13);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(13);
  });

  it("Tales from the Yawning Portal: 7 chapters, classic antagonists use original stat blocks", async () => {
    const seeded = await captureTemplate("Tales from the Yawning Portal");
    assertCampaignEncounterContract(seeded, "Tales from the Yawning Portal", 7);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(7);
    expect(hasTemplate(seeded, "cm-acererak-lich")).toBe(true);
    expect(hasTemplate(seeded, "cm-vecna-robes")).toBe(true);
  });

  it("Ghosts of Saltmarsh: 8 sea-themed encounters, sahuagin baron present with canonical damage types", async () => {
    const seeded = await captureTemplate("Ghosts of Saltmarsh");
    assertCampaignEncounterContract(seeded, "Ghosts of Saltmarsh", 8);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(8);
    expect(hasTemplate(seeded, "cm-sahuagin-baron")).toBe(true);
    for (const mon of allMonsters(seeded)) {
      for (const arr of [mon.damageResistances, mon.damageImmunities, mon.damageVulnerabilities]) {
        for (const v of arr || []) expect(CANONICAL_DAMAGE_TYPES.has(v)).toBe(true);
      }
    }
  });

  it("Waterdeep: Dungeon of the Mad Mage: 13 chapters, 80+ encounters, Halaster and apprentices present", async () => {
    const seeded = await captureTemplate("Waterdeep: Dungeon of the Mad Mage");
    assertCampaignEncounterContract(seeded, "Waterdeep: Dungeon of the Mad Mage", 13);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(80);
    for (const enc of seeded.encounters) expect(enc.monsters.length).toBeGreaterThan(0);
    const names = allMonsters(seeded).map((m) => m.name);
    expect(names.some((n: string) => n.includes("Halaster"))).toBe(true);
    for (const apprentice of ["Arcturia", "Trobriand", "Muiral"]) {
      expect(names.some((n: string) => n.includes(apprentice))).toBe(true);
    }
  });

  it("Rise of the Runelords: 6 chapters, Karzoug present, Pathfinder encounters flagged (5e conversion)", async () => {
    const seeded = await captureTemplate("Rise of the Runelords");
    assertCampaignEncounterContract(seeded, "Rise of the Runelords", 6);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(6);
    expect(hasTemplate(seeded, "cm-karzoug-demon-skin")).toBe(true);
    expect(seeded.encounters.some((e: any) => e.description.includes("(5e conversion)"))).toBe(true);
  });

  it("Kingmaker: 6 chapters, the Lantern King present, Pathfinder encounters flagged (5e conversion)", async () => {
    const seeded = await captureTemplate("Kingmaker");
    assertCampaignEncounterContract(seeded, "Kingmaker", 6);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(6);
    expect(hasTemplate(seeded, "cm-lantern-king")).toBe(true);
    expect(seeded.encounters.some((e: any) => e.description.includes("(5e conversion)"))).toBe(true);
  });

  it("Wrath of the Righteous: 6 chapters, demon lords present, demon damage types canonical", async () => {
    const seeded = await captureTemplate("Wrath of the Righteous");
    assertCampaignEncounterContract(seeded, "Wrath of the Righteous", 6);
    expect(seeded.encounters.length).toBeGreaterThanOrEqual(6);
    const names = allMonsters(seeded).map((m) => m.name);
    for (const lord of ["Deskari", "Baphomet", "Nocticula"]) {
      expect(names.some((n: string) => n.includes(lord))).toBe(true);
    }
    for (const mon of allMonsters(seeded)) {
      for (const arr of [mon.damageResistances, mon.damageImmunities, mon.damageVulnerabilities]) {
        for (const v of arr || []) expect(CANONICAL_DAMAGE_TYPES.has(v)).toBe(true);
      }
    }
  });

  it("does not silently produce empty encounter monster arrays for any G4 campaign", async () => {
    for (const name of [
      "Candlekeep Mysteries",
      "Journeys Through the Radiant Citadel",
      "Keys from the Golden Vault",
      "Tales from the Yawning Portal",
      "Ghosts of Saltmarsh",
      "Waterdeep: Dungeon of the Mad Mage",
      "Rise of the Runelords",
      "Kingmaker",
      "Wrath of the Righteous",
    ]) {
      const seeded = await captureTemplate(name);
      for (const enc of seeded.encounters) expect(enc.monsters.length).toBeGreaterThan(0);
    }
  });
});

describe("populate-campaigns-g4 custom monster invariants", () => {
  const G4_SOURCES = new Set([
    "Candlekeep Mysteries",
    "Journeys Through the Radiant Citadel",
    "Keys from the Golden Vault",
    "Tales from the Yawning Portal",
    "Ghosts of Saltmarsh",
    "Waterdeep: Dungeon of the Mad Mage",
    "Rise of the Runelords",
    "Kingmaker",
    "Wrath of the Righteous",
  ]);
  const g4Monsters = CUSTOM_MONSTERS.filter((m) => G4_SOURCES.has(m.source ?? ""));

  it("adds 150-200 new G4 monsters, all cm- prefixed", () => {
    expect(g4Monsters.length).toBeGreaterThanOrEqual(150);
    expect(g4Monsters.length).toBeLessThanOrEqual(200);
    for (const m of g4Monsters) expect(m.id.startsWith("cm-")).toBe(true);
  });

  it("every G4 monster damage array contains only canonical DamageType values", () => {
    for (const m of g4Monsters) {
      for (const arr of [m.damageResistances, m.damageImmunities, m.damageVulnerabilities]) {
        for (const v of arr || []) expect(CANONICAL_DAMAGE_TYPES.has(v)).toBe(true);
      }
    }
  });

  it("every G4 monster exposes passive Perception as a string", () => {
    for (const m of g4Monsters) {
      const pp = m.senses?.["passive Perception"];
      expect(typeof pp).toBe("string");
    }
  });

  it("every G4 monster id is unique and does not collide with existing custom monsters", () => {
    const g4Ids = g4Monsters.map((m) => m.id);
    expect(new Set(g4Ids).size).toBe(g4Ids.length);
    const nonG4Ids = new Set(
      CUSTOM_MONSTERS.filter((m) => !G4_SOURCES.has(m.source ?? "")).map((m) => m.id)
    );
    for (const id of g4Ids) expect(nonG4Ids.has(id)).toBe(false);
  });
});

describe("runCli", () => {
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (getDatabase as jest.Mock).mockResolvedValue(makeDb());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("executes seed and exits 0 on success", async () => {
    await runCli();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("passes force=true to seed when --force is in process.argv", async () => {
    process.argv.push("--force");
    try {
      await runCli();
    } finally {
      process.argv.pop();
    }
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});

describe("handleCliError", () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs error and exits 1", () => {
    const err = new Error("Seed failed");
    handleCliError(err);

    expect(errorSpy).toHaveBeenCalledWith("Seed failed:", err);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
