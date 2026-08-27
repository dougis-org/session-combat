/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import type { SessionLog } from "@/lib/types";
import { StorageError } from "@/lib/storage/errors";
import * as logger from "@/lib/telemetry/logger";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

const baseLog: SessionLog = {
  id: "log-1",
  userId: "user-1",
  campaignId: "campaign-1",
  sessionNumber: 3,
  datePlayed: new Date("2026-05-01"),
  events: [],
  milestone: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};

function makeCollectionMock(methods: Record<string, jest.Mock>) {
  return { collection: jest.fn(() => methods) };
}

describe("getNextSessionNumber", () => {
  let mockFindOne: jest.Mock;
  let mockDb: { collection: jest.Mock };
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFindOne = jest.fn();
    const mockCollection = { findOne: mockFindOne };
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
    logSpy = jest.spyOn(logger, "logStorageEvent").mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("returns 1 when no sessions exist for the campaign", async () => {
    mockFindOne.mockResolvedValue(null as never);
    const result = await storage.getNextSessionNumber("user-1", "campaign-1");
    expect(result).toBe(1);
  });

  test("returns MAX + 1 when sessions exist", async () => {
    mockFindOne.mockResolvedValue({ ...baseLog, sessionNumber: 5 } as never);
    const result = await storage.getNextSessionNumber("user-1", "campaign-1");
    expect(result).toBe(6);
  });

  test("rejects with a StorageError on DB failure (not a resolved 1)", async () => {
    mockFindOne.mockRejectedValue(new Error("DB error") as never);

    await expect(
      storage.getNextSessionNumber("user-1", "campaign-1")
    ).rejects.toBeInstanceOf(StorageError);
  });

  test("thrown StorageError has op getNextSessionNumber / collection sessionLogs and logs exactly one error event", async () => {
    mockFindOne.mockRejectedValue(new Error("DB error") as never);

    let caught: unknown;
    try {
      await storage.getNextSessionNumber("user-1", "campaign-1");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(StorageError);
    const storageError = caught as StorageError;
    expect(storageError.op).toBe("getNextSessionNumber");
    expect(storageError.collection).toBe("sessionLogs");
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "getNextSessionNumber",
        collection: "sessionLogs",
        outcome: "error",
      })
    );
  });

  test("no-collision: DB failure after an existing session #1 throws instead of resolving to 1 again", async () => {
    mockFindOne.mockResolvedValueOnce({ ...baseLog, sessionNumber: 1 } as never);
    const first = await storage.getNextSessionNumber("user-1", "campaign-1");
    expect(first).toBe(2);

    mockFindOne.mockRejectedValueOnce(new Error("DB error") as never);
    await expect(
      storage.getNextSessionNumber("user-1", "campaign-1")
    ).rejects.toBeInstanceOf(StorageError);
  });
});

describe("storage.loadSessionLogs", () => {
  test("queries sessionLogs by userId and campaignId sorted descending", async () => {
    const toArray = jest.fn<Promise<SessionLog[]>, []>().mockResolvedValue([baseLog]);
    const sort = jest.fn(() => ({ toArray }));
    const find = jest.fn(() => ({ sort }));
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ find }) as never);

    const result = await storage.loadSessionLogs("user-1", "campaign-1");

    expect(find).toHaveBeenCalledWith({ userId: "user-1", campaignId: "campaign-1" });
    expect(sort).toHaveBeenCalledWith({ sessionNumber: -1 });
    expect(result).toHaveLength(1);
    expect(result[0].sessionNumber).toBe(3);
  });

  test("returns empty array on error", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("connection failed") as never);
    const result = await storage.loadSessionLogs("user-1", "campaign-1");
    expect(result).toEqual([]);
  });
});

describe("storage.saveSessionLog", () => {
  test("inserts log without _id field", async () => {
    const insertOne = jest.fn<Promise<unknown>, []>().mockResolvedValue({});
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ insertOne }) as never);

    const logWithId = { ...baseLog, _id: "mongo-id" };
    await storage.saveSessionLog(logWithId as any);

    expect(insertOne).toHaveBeenCalledTimes(1);
    const saved = (insertOne as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(saved._id).toBeUndefined();
    expect(saved.id).toBe("log-1");
  });

  test("throws on error", async () => {
    const insertOne = jest.fn<Promise<unknown>, []>().mockRejectedValue(new Error("DB error"));
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ insertOne }) as never);

    await expect(storage.saveSessionLog(baseLog)).rejects.toThrow("DB error");
  });
});

describe("storage.updateSessionLog", () => {
  test("updates whitelisted fields and converts datePlayed to Date", async () => {
    const findOneAndUpdate = jest.fn<Promise<SessionLog>, []>().mockResolvedValue(baseLog);
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ findOneAndUpdate }) as never);

    await storage.updateSessionLog("log-1", "user-1", "campaign-1", {
      title: "New Title",
      datePlayed: "2026-06-01",
    } as any);

    const setArg = ((findOneAndUpdate as jest.Mock).mock.calls[0][1] as any).$set;
    expect(setArg.title).toBe("New Title");
    expect(setArg.datePlayed).toBeInstanceOf(Date);
    expect(setArg.campaignId).toBeUndefined();
  });

  test("omits datePlayed from $set when not provided", async () => {
    const findOneAndUpdate = jest.fn<Promise<SessionLog>, []>().mockResolvedValue(baseLog);
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ findOneAndUpdate }) as never);

    await storage.updateSessionLog("log-1", "user-1", "campaign-1", { title: "Only Title" });

    const setArg = ((findOneAndUpdate as jest.Mock).mock.calls[0][1] as any).$set;
    expect(setArg.datePlayed).toBeUndefined();
  });

  test("returns null when log not found", async () => {
    const findOneAndUpdate = jest.fn<Promise<null>, []>().mockResolvedValue(null);
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ findOneAndUpdate }) as never);

    const result = await storage.updateSessionLog("missing", "user-1", "campaign-1", {});
    expect(result).toBeNull();
  });

  test("throws on error", async () => {
    const findOneAndUpdate = jest.fn<Promise<never>, []>().mockRejectedValue(new Error("DB error"));
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ findOneAndUpdate }) as never);

    await expect(storage.updateSessionLog("log-1", "user-1", "campaign-1", {})).rejects.toThrow("DB error");
  });
});

describe("storage.deleteSessionLog", () => {
  test("returns true when log is deleted", async () => {
    const deleteOne = jest.fn<Promise<{ deletedCount: number }>, []>()
      .mockResolvedValue({ deletedCount: 1 } as never);
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ deleteOne }) as never);

    const result = await storage.deleteSessionLog("log-1", "user-1", "campaign-1");

    expect(deleteOne).toHaveBeenCalledWith({ id: "log-1", userId: "user-1", campaignId: "campaign-1" });
    expect(result).toBe(true);
  });

  test("returns false when log not found", async () => {
    const deleteOne = jest.fn<Promise<{ deletedCount: number }>, []>()
      .mockResolvedValue({ deletedCount: 0 } as never);
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ deleteOne }) as never);

    const result = await storage.deleteSessionLog("missing", "user-1", "campaign-1");
    expect(result).toBe(false);
  });

  test("throws on error", async () => {
    const deleteOne = jest.fn<Promise<never>, []>().mockRejectedValue(new Error("DB error") as never);
    mockedGetDatabase.mockResolvedValue(makeCollectionMock({ deleteOne }) as never);

    await expect(storage.deleteSessionLog("log-1", "user-1", "campaign-1")).rejects.toThrow("DB error");
  });
});
