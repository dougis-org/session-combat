/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { CampaignMember } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

function makeMockCollection() {
  const toArray = jest.fn<Promise<unknown[]>, []>();
  const find = jest.fn(() => ({ toArray }));
  const findOne = jest.fn<Promise<unknown>, []>();
  const updateOne = jest.fn<Promise<unknown>, []>();
  const insertOne = jest.fn<Promise<unknown>, []>();
  const deleteOne = jest.fn<Promise<unknown>, []>();
  return { find, toArray, findOne, updateOne, insertOne, deleteOne };
}

const MOCK_MEMBER: CampaignMember = {
  id: "mem-1",
  campaignId: "camp-1",
  userId: "user-1",
  role: "dm",
  status: "active",
  history: [{ action: "active", by: "user-1", at: new Date("2026-06-01T00:00:00Z") }],
};

describe("getMember", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  it("returns normalized CampaignMember (without _id) when record exists", async () => {
    const rawDoc = { _id: "mongo-oid-1", ...MOCK_MEMBER };
    mockCollection.findOne.mockResolvedValue(rawDoc as never);

    const result = await storage.getMember("camp-1", "user-1");

    expect(mockDb.collection).toHaveBeenCalledWith("campaignMembers");
    expect(mockCollection.findOne).toHaveBeenCalledWith({ campaignId: "camp-1", userId: "user-1" });
    expect(result).not.toBeNull();
    expect(result!.id).toBe("mem-1");
    expect(result!.role).toBe("dm");
    expect(result!.status).toBe("active");
    expect(result).not.toHaveProperty("_id");
  });

  it("returns null when no matching record", async () => {
    mockCollection.findOne.mockResolvedValue(null as never);

    const result = await storage.getMember("camp-1", "unknown-user");

    expect(result).toBeNull();
  });

  it("rethrows on unexpected error", async () => {
    mockCollection.findOne.mockRejectedValue(new Error("DB failure") as never);

    await expect(storage.getMember("camp-1", "user-1")).rejects.toThrow("DB failure");
  });
});

describe("loadCampaignByIdAny", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  const MOCK_CAMPAIGN_DOC = {
    _id: "mongo-oid-2",
    id: "camp-1",
    userId: "owner-user",
    name: "Test Campaign",
    chapters: [],
    status: "active" as const,
    notes: "",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  it("returns normalized Campaign when campaign exists (no userId filter)", async () => {
    mockCollection.findOne.mockResolvedValue(MOCK_CAMPAIGN_DOC as never);

    const result = await storage.loadCampaignByIdAny("camp-1");

    expect(mockDb.collection).toHaveBeenCalledWith("campaigns");
    expect(mockCollection.findOne).toHaveBeenCalledWith({ id: "camp-1" });
    expect(result).not.toBeNull();
    expect(result!.id).toBe("camp-1");
    expect(result!.name).toBe("Test Campaign");
  });

  it("returns null when campaign does not exist", async () => {
    mockCollection.findOne.mockResolvedValue(null as never);

    const result = await storage.loadCampaignByIdAny("nonexistent");

    expect(result).toBeNull();
  });

  it("rethrows on unexpected error", async () => {
    mockCollection.findOne.mockRejectedValue(new Error("DB failure") as never);

    await expect(storage.loadCampaignByIdAny("camp-1")).rejects.toThrow("DB failure");
  });
});
