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
