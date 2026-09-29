/**
 * @jest-environment node
 */
import * as partyRepo from "@/lib/storage/partyRepo";
import { PartyCampaignAuthorizationError } from "@/lib/storage/errors";
import { getDatabase } from "@/lib/db";
import { getMember } from "@/lib/storage/membershipRepo";
import { Party } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("@/lib/storage/membershipRepo", () => ({
  getMember: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);
const mockedGetMember = jest.mocked(getMember);

function makeMockCollection() {
  const toArray = jest.fn<Promise<unknown[]>, []>().mockResolvedValue([]);
  const find = jest.fn(() => ({ toArray }));
  const findOne = jest.fn<Promise<unknown>, [filter?: unknown]>().mockResolvedValue(null);
  const updateOne = jest.fn<Promise<unknown>, []>().mockResolvedValue(undefined);
  const updateMany = jest.fn<Promise<unknown>, []>().mockResolvedValue(undefined);
  return { find, toArray, findOne, updateOne, updateMany };
}

const ACTIVE_DM = { id: "mem-1", campaignId: "camp-1", userId: "dm-user", role: "dm" as const, status: "active" as const, history: [] };
const ACTIVE_PLAYER = { ...ACTIVE_DM, role: "player" as const };
const INACTIVE_DM = { ...ACTIVE_DM, status: "invited" as const };

describe("addPartyToCampaign", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  it("throws PartyCampaignAuthorizationError when caller has no membership", async () => {
    mockedGetMember.mockResolvedValue(null);

    await expect(
      partyRepo.addPartyToCampaign("camp-1", "party-1", "not-a-member")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
    expect(mockDb.collection).not.toHaveBeenCalled();
  });

  it("throws PartyCampaignAuthorizationError when caller is a non-DM member", async () => {
    mockedGetMember.mockResolvedValue(ACTIVE_PLAYER as never);

    await expect(
      partyRepo.addPartyToCampaign("camp-1", "party-1", "player-user")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
  });

  it("throws PartyCampaignAuthorizationError when DM membership is not active", async () => {
    mockedGetMember.mockResolvedValue(INACTIVE_DM as never);

    await expect(
      partyRepo.addPartyToCampaign("camp-1", "party-1", "dm-user")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
  });

  it("throws PartyCampaignAuthorizationError when caller is DM of a different campaign", async () => {
    mockedGetMember.mockImplementation(async (campaignId: string) =>
      campaignId === "camp-1" ? null : (ACTIVE_DM as never)
    );

    await expect(
      partyRepo.addPartyToCampaign("camp-1", "party-1", "dm-user")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
  });

  it("succeeds and adds the party when caller is an active DM", async () => {
    mockedGetMember.mockResolvedValue(ACTIVE_DM as never);
    mockCollection.findOne.mockResolvedValue({ id: "camp-1", partyIds: [] });

    await partyRepo.addPartyToCampaign("camp-1", "party-1", "dm-user");

    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { id: "camp-1" },
      { $addToSet: { partyIds: "party-1" } }
    );
  });
});

describe("reassignPartyCampaign", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };
  const PARTY: Party = {
    id: "party-1",
    userId: "user-1",
    name: "Fellowship",
    description: "",
    members: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  it("is a no-op and performs no membership lookup when campaignId is omitted", async () => {
    await partyRepo.reassignPartyCampaign({ ...PARTY }, undefined, "old-camp", "dm-user");

    expect(mockedGetMember).not.toHaveBeenCalled();
    expect(mockDb.collection).not.toHaveBeenCalled();
  });

  it("rejects a non-string, non-undefined campaignId", async () => {
    await expect(
      partyRepo.reassignPartyCampaign({ ...PARTY }, 123, undefined, "dm-user")
    ).rejects.toThrow();
    expect(mockedGetMember).not.toHaveBeenCalled();
  });

  it("throws and does not remove the party when caller is not an active DM of the existing campaign (unlink)", async () => {
    mockedGetMember.mockResolvedValue(null);

    await expect(
      partyRepo.reassignPartyCampaign({ ...PARTY }, "", "old-camp", "not-a-dm")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
    expect(mockCollection.updateOne).not.toHaveBeenCalled();
  });

  it("throws and does not remove the party when caller is DM of an unrelated campaign (unlink)", async () => {
    mockedGetMember.mockImplementation(async (campaignId: string) =>
      campaignId === "old-camp" ? null : (ACTIVE_DM as never)
    );

    await expect(
      partyRepo.reassignPartyCampaign({ ...PARTY }, "", "old-camp", "dm-user")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
    expect(mockCollection.updateOne).not.toHaveBeenCalled();
  });

  it("unlinks only from the authorized existing campaign, never a blanket removal", async () => {
    mockedGetMember.mockResolvedValue(ACTIVE_DM as never);
    mockCollection.findOne.mockResolvedValue({ id: "old-camp", partyIds: ["party-1"] });
    const party = { ...PARTY, campaignId: "old-camp" };

    await partyRepo.reassignPartyCampaign(party, "", "old-camp", "dm-user");

    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { id: "old-camp" },
      { $pull: { partyIds: "party-1" } }
    );
    expect(mockCollection.updateMany).not.toHaveBeenCalled();
    expect(party.campaignId).toBeUndefined();
  });

  it("throws when caller is not an active DM of the new campaign on a fresh link (no existing campaign)", async () => {
    mockedGetMember.mockResolvedValue(null);

    await expect(
      partyRepo.reassignPartyCampaign({ ...PARTY }, "new-camp", undefined, "not-a-dm")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
  });

  it("relinks successfully when caller is an active DM of both the old and new campaigns", async () => {
    mockedGetMember.mockResolvedValue(ACTIVE_DM as never);
    mockCollection.findOne.mockImplementation(async (filter) => {
      const { id } = filter as { id: string };
      if (id === "old-camp") return { id: "old-camp", partyIds: ["party-1"] };
      if (id === "new-camp") return { id: "new-camp", partyIds: [] };
      return null;
    });
    const party = { ...PARTY, campaignId: "old-camp" };

    await partyRepo.reassignPartyCampaign(party, "new-camp", "old-camp", "dm-user");

    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { id: "old-camp" },
      { $pull: { partyIds: "party-1" } }
    );
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { id: "new-camp" },
      { $addToSet: { partyIds: "party-1" } }
    );
  });

  it("authorizes and removes a campaign discovered via a live partyIds lookup, not just the passed-in hint", async () => {
    mockedGetMember.mockResolvedValue(ACTIVE_DM as never);
    mockCollection.toArray.mockResolvedValue([{ id: "stray-camp", partyIds: ["party-1"] }]);
    mockCollection.findOne.mockResolvedValue({ id: "stray-camp", partyIds: ["party-1"] });
    const party = { ...PARTY };

    await partyRepo.reassignPartyCampaign(party, "", undefined, "dm-user");

    expect(mockedGetMember).toHaveBeenCalledWith("stray-camp", "dm-user");
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { id: "stray-camp" },
      { $pull: { partyIds: "party-1" } }
    );
  });

  it("restores an already-removed campaign link if removing a later one fails", async () => {
    mockedGetMember.mockResolvedValue(ACTIVE_DM as never);
    mockCollection.toArray.mockResolvedValue([{ id: "camp-a" }, { id: "camp-b" }]);
    mockCollection.findOne.mockResolvedValue({ partyIds: ["party-1"] });
    mockCollection.updateOne
      .mockResolvedValueOnce(undefined) // remove from camp-a succeeds
      .mockRejectedValueOnce(new Error("boom")); // remove from camp-b fails

    await expect(
      partyRepo.reassignPartyCampaign({ ...PARTY }, "", "camp-a", "dm-user")
    ).rejects.toThrow();

    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { id: "camp-a" },
      { $addToSet: { partyIds: "party-1" } }
    );
  });

  it("throws without removing anything when caller is not DM of a campaign found only via live lookup", async () => {
    mockedGetMember.mockResolvedValue(null);
    mockCollection.toArray.mockResolvedValue([{ id: "stray-camp", partyIds: ["party-1"] }]);

    await expect(
      partyRepo.reassignPartyCampaign({ ...PARTY }, "", undefined, "not-a-dm")
    ).rejects.toBeInstanceOf(PartyCampaignAuthorizationError);
    expect(mockCollection.updateOne).not.toHaveBeenCalled();
  });
});
