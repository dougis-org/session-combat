/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/parties/[id]/route";
import * as partyRepo from "@/lib/storage/partyRepo";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/partyRepo", () => ({
  loadParties: jest.fn(),
  saveParty: jest.fn(),
  deleteParty: jest.fn(),
  canAddToCampaignParty: jest.fn(),
  reassignPartyCampaign: jest.fn(),
  getCurrentCampaignId: jest.fn(),
  isActiveDm: jest.fn(),
}));

const mockedPartyRepo = jest.mocked(partyRepo);

describe("PUT /api/parties/[id] — campaign authorization and character sharing", () => {
  const EXISTING_PARTY = {
    id: "party-123",
    userId: "user-123",
    name: "Old Name",
    description: "",
    members: [{ characterId: "char-1", addedAt: new Date("2026-04-07T00:00:00.000Z") }],
    createdAt: new Date("2026-04-07T00:00:00.000Z"),
    updatedAt: new Date("2026-04-07T00:01:00.000Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue([EXISTING_PARTY] as any);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);
    mockedPartyRepo.reassignPartyCampaign.mockResolvedValue(undefined as any);
    // Default: the live-resolved current campaign matches whatever legacy
    // campaignId hint is on the loaded party, preserving pre-migration
    // semantics for tests that don't care about the live/legacy distinction.
    mockedPartyRepo.getCurrentCampaignId.mockImplementation(
      async (_partyId: string, legacyCampaignId?: string) => legacyCampaignId
    );
    mockedPartyRepo.isActiveDm.mockResolvedValue(true);
  });

  it("B3-1: returns 403 when adding unshared character to campaign party", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-new-unshared"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
  });

  it("B3-2: returns 200 when adding shared character to campaign party", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(true);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-new-shared"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
  });

  it("B3-3: re-adding existing active member does not trigger share check", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-1"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
    expect(mockedPartyRepo.canAddToCampaignParty).not.toHaveBeenCalled();
  });

  it("B3-4: no share check when party has no campaignId", async () => {
    mockedPartyRepo.loadParties.mockResolvedValue([EXISTING_PARTY] as any);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-new"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
    expect(mockedPartyRepo.canAddToCampaignParty).not.toHaveBeenCalled();
  });

  it("B4-1: re-validates existing members' sharing when moving to a new campaign without characterIds, and rejects if unshared", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect(mockedPartyRepo.canAddToCampaignParty).toHaveBeenCalledWith("camp-2", "char-1", "user-123");
    expect(mockedPartyRepo.reassignPartyCampaign).not.toHaveBeenCalled();
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("B4-2: allows moving to a new campaign without characterIds when existing members are shared there", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(true);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
    expect(mockedPartyRepo.canAddToCampaignParty).toHaveBeenCalledWith("camp-2", "char-1", "user-123");
  });

  it("B4-3: re-checks sharing against the live-resolved campaign even when the party's own campaignId field is stale/absent", async () => {
    // Simulates a party that has already migrated to campaigns.partyIds:
    // the deprecated campaignId field on the party document is gone, but
    // the party is still live-linked to a campaign.
    mockedPartyRepo.loadParties.mockResolvedValue([{ ...EXISTING_PARTY, campaignId: undefined }] as any);
    mockedPartyRepo.getCurrentCampaignId.mockResolvedValue("camp-1");
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-1", "char-new-unshared"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect(mockedPartyRepo.canAddToCampaignParty).toHaveBeenCalledWith("camp-1", "char-new-unshared", "user-123");
  });

  it("B4-4: rejects a campaign link before running the sharing check when caller is not an active DM of the new campaign", async () => {
    mockedPartyRepo.isActiveDm.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect(mockedPartyRepo.canAddToCampaignParty).not.toHaveBeenCalled();
    expect(mockedPartyRepo.reassignPartyCampaign).not.toHaveBeenCalled();
  });

  it("B4-5: rolls back the campaign reassignment if saveParty fails afterward", async () => {
    mockedPartyRepo.getCurrentCampaignId.mockResolvedValue(undefined);
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.reassignPartyCampaign.mockResolvedValueOnce(undefined as any);
    mockedPartyRepo.saveParty.mockRejectedValueOnce(new Error("db write failed"));

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(500);
    expect(mockedPartyRepo.reassignPartyCampaign).toHaveBeenCalledTimes(2);
    expect(mockedPartyRepo.reassignPartyCampaign).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: "party-123" }),
      { kind: "set", value: "" },
      "camp-2",
      "user-123"
    );
  });
});
