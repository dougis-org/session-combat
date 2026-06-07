/**
 * @jest-environment node
 */

let mockConnect: jest.Mock;
let mockCreateCollection: jest.Mock;

beforeEach(() => {
  mockConnect = jest.fn().mockResolvedValue(undefined);
  mockCreateCollection = jest.fn().mockResolvedValue({});

  jest.resetModules();

  const mockCreateIndex = jest.fn().mockResolvedValue({});
  const mockDb = {
    admin: jest.fn().mockReturnValue({ ping: jest.fn().mockResolvedValue({}) }),
    collection: jest.fn().mockReturnValue({ createIndex: mockCreateIndex }),
    createCollection: mockCreateCollection,
    listCollections: jest
      .fn()
      .mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  };

  jest.doMock("mongodb", () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
      connect: mockConnect,
      db: jest.fn().mockReturnValue(mockDb),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  }));
});

describe("connectToDatabase", () => {
  test("T1-A: concurrent callers share one initialisation", async () => {
    const { connectToDatabase } = require("@/lib/db");

    const [r1, r2] = await Promise.all([
      connectToDatabase(),
      connectToDatabase(),
    ]);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockCreateCollection).toHaveBeenCalledTimes(1);
    expect(r1.db).toBe(r2.db);
  });

  test("T1-B: subsequent callers use the cache", async () => {
    const { connectToDatabase } = require("@/lib/db");

    const r1 = await connectToDatabase();
    const r2 = await connectToDatabase();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockCreateCollection).toHaveBeenCalledTimes(1);
    expect(r1.db).toBe(r2.db);
  });

  test("T1-C: failed connection allows retry", async () => {
    mockConnect
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValue(undefined);

    const { connectToDatabase } = require("@/lib/db");

    await expect(connectToDatabase()).rejects.toThrow("connection refused");
    const result = await connectToDatabase();
    expect(result).toBeDefined();
    expect(mockConnect).toHaveBeenCalledTimes(2);
  });
});
