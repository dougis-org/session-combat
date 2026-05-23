import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import type { SessionLog } from "@/lib/types";

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

describe("getNextSessionNumber", () => {
  let mockFindOne: jest.Mock;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    mockFindOne = jest.fn();
    const mockCollection = { findOne: mockFindOne };
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
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

  test("returns 1 on error (fallback)", async () => {
    mockFindOne.mockRejectedValue(new Error("DB error") as never);
    const result = await storage.getNextSessionNumber("user-1", "campaign-1");
    expect(result).toBe(1);
  });
});
