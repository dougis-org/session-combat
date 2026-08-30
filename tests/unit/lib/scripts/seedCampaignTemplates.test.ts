import { runCli, handleCliError, seedCampaignTemplates } from "../../../../lib/scripts/seedCampaignTemplates";
import { getDatabase } from "../../../../lib/db";
import { GLOBAL_USER_ID } from "../../../../lib/constants";

jest.mock("../../../../lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../../../lib/constants", () => ({
  GLOBAL_USER_ID: "GLOBAL",
}));

function makeCollection(existingDocs: any[] = []) {
  return {
    findOne: jest.fn().mockImplementation(async (query: any) => {
      return existingDocs.find(d => d.name === query.name && d.userId === query.userId) || null;
    }),
    insertOne: jest.fn().mockResolvedValue({ insertedId: "some-id" }),
  };
}

function makeDb(existingDocs: any[] = []) {
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
    expect(result.inserted).toBeGreaterThan(10);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping (exists): Curse of Strahd"));
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
