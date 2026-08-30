import { seedGlobalMonsters, runCli, handleCliError } from "../../../../lib/scripts/seedGlobalMonsters";
import { getDatabase } from "../../../../lib/db";
import { CUSTOM_MONSTERS } from "../../../../lib/data/customMonsters";

jest.mock("../../../../lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../../../lib/data/customMonsters", () => ({
  CUSTOM_MONSTERS: [
    { id: "m1", userId: "GLOBAL", name: "Monster 1" },
    { id: "m2", userId: "GLOBAL", name: "Monster 2" },
  ],
}));

function makeCollection(existingDocs: Array<{id: string; userId: string}> = []) {
  return {
    findOne: jest.fn().mockImplementation(async (query: {id: string; userId: string}) => {
      return existingDocs.find(d => d.id === query.id && d.userId === query.userId) || null;
    }),
    insertOne: jest.fn().mockResolvedValue({ insertedId: "some-id" }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
}

function makeDb(existingDocs: Array<{id: string; userId: string}> = []) {
  return { collection: jest.fn().mockReturnValue(makeCollection(existingDocs)) };
}

describe("seedGlobalMonsters", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("inserts missing monsters and updates existing ones", async () => {
    // One existing doc, one missing
    const existingDocs = [{ id: "m1", userId: "GLOBAL" }];
    const dbMock = makeDb(existingDocs);
    (getDatabase as jest.Mock).mockResolvedValue(dbMock);

    const result = await seedGlobalMonsters();

    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(1);
    
    // Check logs
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Seeding 2 custom global monsters..."));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Updated: Monster 1"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Inserted: Monster 2"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Done. Inserted: 1, Updated: 1"));
    
    // Check db calls
    const collectionMock = dbMock.collection();
    expect(collectionMock.findOne).toHaveBeenCalledTimes(2);
    expect(collectionMock.updateOne).toHaveBeenCalledTimes(1);
    expect(collectionMock.insertOne).toHaveBeenCalledTimes(1);
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
