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
