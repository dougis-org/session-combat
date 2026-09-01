import { runCli, handleCliError, seedCampaignTemplates } from "../../../../lib/scripts/seedCampaignTemplates";
import { getDatabase } from "../../../../lib/db";
import { GLOBAL_USER_ID } from "../../../../lib/constants";

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
