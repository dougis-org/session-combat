import { runCli } from "../../../../lib/scripts/migrateGlobalMonsters";

jest.mock("../../../../lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../../../lib/constants", () => ({
  GLOBAL_USER_ID: "GLOBAL",
}));

const { getDatabase } = require("../../../../lib/db");

function makeCollection(modifiedCount: number) {
  return { updateMany: jest.fn().mockResolvedValue({ modifiedCount }) };
}

function makeDb(modifiedCount: number) {
  return { collection: jest.fn().mockReturnValue(makeCollection(modifiedCount)) };
}

describe("runCli", () => {
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs count and exits 0 on success", async () => {
    getDatabase.mockResolvedValue(makeDb(5));

    await runCli();

    expect(logSpy).toHaveBeenCalledWith("Successfully updated 5 global monsters");
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
