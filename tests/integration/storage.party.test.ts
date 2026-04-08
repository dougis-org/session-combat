const mockUpdateOne = jest.fn();
const mockCollection = jest.fn(() => ({
  updateOne: mockUpdateOne,
}));
const mockGetDatabase = jest.fn();

jest.mock("../../lib/db", () => ({
  getDatabase: (...args: any[]) => mockGetDatabase(...args),
}));

import { storage } from "../../lib/storage";
import { Party } from "../../lib/types";

describe("storage.saveParty", () => {
  beforeEach(() => {
    mockUpdateOne.mockReset();
    mockCollection.mockClear();
    mockGetDatabase.mockReset();

    mockGetDatabase.mockResolvedValue({
      collection: mockCollection,
    });
    mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedId: null,
    });
  });

  it("upserts parties by application id and userId even when _id exists", async () => {
    const party: Party = {
      _id: "507f1f77bcf86cd799439011",
      id: "party-123",
      userId: "user-1",
      name: "Updated Party",
      description: "Edited without relying on MongoDB _id",
      characterIds: ["char-1"],
      createdAt: new Date("2026-04-07T00:00:00.000Z"),
      updatedAt: new Date("2026-04-07T00:05:00.000Z"),
    };

    await storage.saveParty(party);

    expect(mockCollection).toHaveBeenCalledWith("parties");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "party-123", userId: "user-1" },
      {
        $set: {
          id: "party-123",
          userId: "user-1",
          name: "Updated Party",
          description: "Edited without relying on MongoDB _id",
          characterIds: ["char-1"],
          createdAt: new Date("2026-04-07T00:00:00.000Z"),
          updatedAt: new Date("2026-04-07T00:05:00.000Z"),
        },
      },
      { upsert: true }
    );
  });
});
