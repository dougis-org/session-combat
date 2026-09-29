/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import * as membershipRepo from "@/lib/storage/membershipRepo";
import { PartyCampaignAuthorizationError } from "@/lib/storage/errors";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedDb = {
  collection: jest.fn(),
};

jest.mocked(getDatabase).mockResolvedValue(mockedDb as any);

describe("storage.loadPartiesByCampaign", () => {
  const makeParty = (id: string, campaignId: string) => ({
    id,
    userId: "dm-1",
    name: `Party ${id}`,
    members: [],
    campaignId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("A3-1: returns only parties matching the campaignId", async () => {
    const mockToArray = jest.fn().mockResolvedValue([makeParty("p-1", "camp-A")]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-A", partyIds: ["p-1"] });
    mockedDb.collection.mockImplementation((name) => {
      if (name === "campaigns") return { findOne: mockFindOne, updateOne: jest.fn() };
      return { find: mockFind };
    });

    const result = await storage.loadPartiesByCampaign("camp-A");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-1");
  });

  it("A3-2: returns empty array when no parties in campaign", async () => {
    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-X", partyIds: [] });
    mockedDb.collection.mockImplementation((name) => {
      if (name === "campaigns") return { findOne: mockFindOne, updateOne: jest.fn() };
      return { find: mockFind };
    });

    const result = await storage.loadPartiesByCampaign("camp-X");

    expect(result).toEqual([]);
  });

  it("A3-4: performs lazy migration when partyIds is undefined", async () => {
    const mockToArray = jest.fn().mockResolvedValue([makeParty("p-legacy", "camp-legacy")]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-legacy" }); // partyIds is undefined
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    mockedDb.collection.mockImplementation((name) => {
      if (name === "campaigns") return { findOne: mockFindOne, updateOne: mockUpdateOne };
      return { find: mockFind };
    });

    const result = await storage.loadPartiesByCampaign("camp-legacy");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-legacy");

    // Assert it queried by campaignId
    expect(mockFind).toHaveBeenCalledWith({ campaignId: "camp-legacy" });

    // Assert it triggered migration
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-legacy" },
      { $set: { partyIds: ["p-legacy"] } }
    );
  });

  it("A3-3: emits perf log when query exceeds 10ms", async () => {
    let nowCallCount = 0;
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => {
      nowCallCount++;
      return nowCallCount === 1 ? 1000 : 1020; // 20ms elapsed
    });

    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-slow", partyIds: [] });
    mockedDb.collection.mockImplementation((name) => {
      if (name === "campaigns") return { findOne: mockFindOne, updateOne: jest.fn() };
      return { find: mockFind };
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await storage.loadPartiesByCampaign("camp-slow");

    const perfCalls = consoleSpy.mock.calls.filter(
      args => typeof args[0] === "string" && args[0].includes("[perf] loadPartiesByCampaign")
    );
    expect(perfCalls.length).toBeGreaterThan(0);

    nowSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe("storage.setPartyMemberLeftAt", () => {
  const makeParty = (id: string, members: object[]) => ({
    id,
    userId: "dm-1",
    name: `Party ${id}`,
    campaignId: "camp-1",
    members,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("A4-1: sets leftAt on active member with matching characterId", async () => {
    const party = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date() }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([party] as any);
    const saveSpy = jest.spyOn(storage, "saveParty").mockResolvedValue();

    const now = new Date();
    await storage.setPartyMemberLeftAt("camp-1", "char-X", now);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedParty = saveSpy.mock.calls[0][0];
    const member = savedParty.members.find((m: any) => m.characterId === "char-X");
    expect(member?.leftAt).toBe(now);
  });

  it("A4-2: does not modify already-left members", async () => {
    const existingLeftAt = new Date("2026-01-01");
    const party = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date(), leftAt: existingLeftAt }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([party] as any);
    const saveSpy = jest.spyOn(storage, "saveParty").mockResolvedValue();

    await storage.setPartyMemberLeftAt("camp-1", "char-X", new Date());

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("A4-3: updates multiple parties in the same campaign", async () => {
    const p1 = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date() }]);
    const p2 = makeParty("p-2", [{ characterId: "char-X", addedAt: new Date() }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([p1, p2] as any);
    const saveSpy = jest.spyOn(storage, "saveParty").mockResolvedValue();

    await storage.setPartyMemberLeftAt("camp-1", "char-X", new Date());

    expect(saveSpy).toHaveBeenCalledTimes(2);
  });

  it("A4-4: does not throw when saveParty throws", async () => {
    const party = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date() }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([party] as any);
    jest.spyOn(storage, "saveParty").mockRejectedValue(new Error("DB error"));

    await expect(storage.setPartyMemberLeftAt("camp-1", "char-X", new Date())).resolves.not.toThrow();
  });
});

describe("storage.canAddToCampaignParty", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("A5-1: returns true when character is owned by the DM", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "dm-user"
    } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(true);
  });

  it("A5-2: returns true when share exists and member is active", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue({
      campaignId: "camp-1", characterId: "char-1", userId: "player-1"
    });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue({ status: "active" } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(true);
  });

  it("A5-3: returns false when share exists but member is invited", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue({
      campaignId: "camp-1", characterId: "char-1", userId: "player-1"
    });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue({ status: "invited" } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });

  it("A5-4: returns false when no share exists", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue(null);
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });

  it("A5-5: returns false when share exists but member is removed", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue({
      campaignId: "camp-1", characterId: "char-1", userId: "player-1"
    });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue({ status: "removed" } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });

  it("A5-6: returns false when character not found", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue(null);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });
});

describe("storage.addPartyToCampaign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue({
      id: "mem-1", campaignId: "camp-1", userId: "dm-user", role: "dm", status: "active", history: [],
    } as any);
  });

  it("A3-1: uses $addToSet when campaign.partyIds is already an array", async () => {
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-1", partyIds: ["existing-party"] });
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne, updateOne: mockUpdateOne });

    await storage.addPartyToCampaign("camp-1", "new-party", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $addToSet: { partyIds: "new-party" } }
    );
  });

  it("A3-2: migrates legacy parties when campaign.partyIds is undefined", async () => {
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-1" }); // no partyIds field
    const mockToArray = jest.fn().mockResolvedValue([
      { id: "legacy-1" },
      { id: "legacy-2" },
    ]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockedDb.collection.mockImplementation((col: string) => {
      if (col === "parties") return { find: mockFind };
      return { findOne: mockFindOne, updateOne: mockUpdateOne };
    });

    await storage.addPartyToCampaign("camp-1", "new-party", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $set: { partyIds: ["legacy-1", "legacy-2", "new-party"] } }
    );
  });

  it("A3-3: uses $addToSet when campaign is found with empty partyIds array", async () => {
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-1", partyIds: [] });
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne, updateOne: mockUpdateOne });

    await storage.addPartyToCampaign("camp-1", "new-party", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $addToSet: { partyIds: "new-party" } }
    );
  });

  it("A3-4: uses $addToSet when campaign is not found (null)", async () => {
    const mockFindOne = jest.fn().mockResolvedValue(null);
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 0 });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne, updateOne: mockUpdateOne });

    await storage.addPartyToCampaign("camp-1", "new-party", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $addToSet: { partyIds: "new-party" } }
    );
  });

  it("throws PartyCampaignAuthorizationError when caller is not an active DM", async () => {
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue(null);

    await expect(
      storage.addPartyToCampaign("camp-1", "new-party", "not-a-dm")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
  });
});

describe("storage.removePartyFromCampaign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue({
      id: "mem-1", campaignId: "camp-1", userId: "dm-user", role: "dm", status: "active", history: [],
    } as any);
  });

  it("A4-1: uses $pull when campaign.partyIds is already an array", async () => {
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-1", partyIds: ["party-1", "party-2"] });
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne, updateOne: mockUpdateOne });

    await storage.removePartyFromCampaign("camp-1", "party-1", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $pull: { partyIds: "party-1" } }
    );
  });

  it("A4-2: migrates legacy parties and excludes target when campaign.partyIds is undefined", async () => {
    const mockFindOne = jest.fn().mockResolvedValue({ id: "camp-1" }); // no partyIds field
    const mockToArray = jest.fn().mockResolvedValue([
      { id: "party-1" },
      { id: "party-2" },
    ]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockedDb.collection.mockImplementation((col: string) => {
      if (col === "parties") return { find: mockFind };
      return { findOne: mockFindOne, updateOne: mockUpdateOne };
    });

    await storage.removePartyFromCampaign("camp-1", "party-1", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $set: { partyIds: ["party-2"] } }
    );
  });

  it("A4-3: uses $pull when campaign is not found (null)", async () => {
    const mockFindOne = jest.fn().mockResolvedValue(null);
    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 0 });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne, updateOne: mockUpdateOne });

    await storage.removePartyFromCampaign("camp-1", "party-1", "dm-user");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $pull: { partyIds: "party-1" } }
    );
  });

  it("throws PartyCampaignAuthorizationError when caller is not an active DM", async () => {
    jest.spyOn(membershipRepo, "getMember").mockResolvedValue(null);

    await expect(
      storage.removePartyFromCampaign("camp-1", "party-1", "not-a-dm")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
  });
});

describe("storage.removePartyFromAllCampaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("A4-4: calls updateMany to pull party from all campaigns", async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
    mockedDb.collection.mockReturnValue({ updateMany: mockUpdateMany });

    await storage.removePartyFromAllCampaigns("party-1");

    expect(mockUpdateMany).toHaveBeenCalledWith(
      { partyIds: "party-1" },
      { $pull: { partyIds: "party-1" } }
    );
  });

  it("A4-5: resolves successfully even when no campaigns contain the party", async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });
    mockedDb.collection.mockReturnValue({ updateMany: mockUpdateMany });

    await expect(storage.removePartyFromAllCampaigns("party-1")).resolves.not.toThrow();
  });
});
