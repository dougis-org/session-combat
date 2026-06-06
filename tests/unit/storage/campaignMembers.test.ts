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

describe("listInvitationsForUser", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  const INVITED_1: CampaignMember = {
    id: "mem-inv-1",
    campaignId: "camp-1",
    userId: "user-1",
    role: "player",
    status: "invited",
    history: [{ action: "invited", by: "dm-1", at: new Date("2026-06-01") }],
  };

  const INVITED_2: CampaignMember = {
    id: "mem-inv-2",
    campaignId: "camp-2",
    userId: "user-1",
    role: "player",
    status: "invited",
    history: [{ action: "invited", by: "dm-2", at: new Date("2026-06-02") }],
  };

  it("returns only 'invited' memberships for the user", async () => {
    mockCollection.toArray.mockResolvedValue([
      { _id: "oid-1", ...INVITED_1 },
      { _id: "oid-2", ...INVITED_2 },
    ] as never);

    const result = await storage.listInvitationsForUser("user-1");

    expect(mockDb.collection).toHaveBeenCalledWith("campaignMembers");
    expect(mockCollection.find).toHaveBeenCalledWith({ userId: "user-1", status: "invited" });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("mem-inv-1");
    expect(result[1].id).toBe("mem-inv-2");
    expect(result[0]).not.toHaveProperty("_id");
  });

  it("returns empty array when no pending invitations", async () => {
    mockCollection.toArray.mockResolvedValue([] as never);

    const result = await storage.listInvitationsForUser("user-1");

    expect(result).toEqual([]);
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
