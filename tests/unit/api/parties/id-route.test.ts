/**
 * @jest-environment node
 */
import { GET as GET_ONE, PUT, DELETE } from "@/app/api/parties/[id]/route";
import * as partyRepo from "@/lib/storage/partyRepo";
import { PartyCampaignAuthorizationError } from "@/lib/storage/errors";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
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

describe("PUT /api/parties/[id]", () => {
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
    (mockedPartyRepo as any).getCurrentCampaignId.mockImplementation(
      async (_partyId: string, legacyCampaignId?: string) => legacyCampaignId
    );
    (mockedPartyRepo as any).isActiveDm.mockResolvedValue(true);
  });

  it("updates party fields and returns 200", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "New Name",
        description: "Updated",
        characterIds: ["char-1", "char-2"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
    expect(mockedPartyRepo.saveParty).toHaveBeenCalledTimes(1);
    const savedParty = (mockedPartyRepo.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty).toMatchObject({
      id: "party-123",
      userId: "user-123",
      name: "New Name",
      description: "Updated",
    });
    const activeIds = savedParty.members.filter((m: { leftAt?: Date }) => !m.leftAt).map((m: { characterId: string }) => m.characterId);
    expect(activeIds).toContain("char-1");
    expect(activeIds).toContain("char-2");
  });

  it("strips _id from saved payload", async () => {
    await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "New Name",
        description: "Updated",
        characterIds: [],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    const savedParty = (mockedPartyRepo.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty._id).toBeUndefined();
  });

  it("returns 400 when name is blank", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", { name: "  " }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(400);
  });

  it("sets campaignId when non-empty string provided", async () => {
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: " camp-1 ",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(mockedPartyRepo.reassignPartyCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ id: "party-123" }),
      { kind: "set", value: "camp-1" },
      undefined,
      "user-123"
    );
  });

  it("removes campaignId when empty string provided", async () => {
    mockedPartyRepo.loadParties.mockResolvedValue([
      { ...EXISTING_PARTY, campaignId: "old-camp" },
    ] as any);
    await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(mockedPartyRepo.reassignPartyCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ id: "party-123" }),
      { kind: "set", value: "" },
      "old-camp",
      "user-123"
    );
  });

  it("returns 400 when campaignId is not a string or undefined", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: 123,
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 for each non-string, non-undefined campaignId type", async () => {
    for (const badValue of [null, 42, true, [], {}]) {
      const response = await PUT(
        makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
          name: "Name",
          campaignId: badValue,
        }),
        { params: Promise.resolve({ id: "party-123" }) }
      );
      expect(response.status).toBe(400);
    }
  });

  it("treats a whitespace-only campaignId as unlink (empty), not an error", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "   ",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(200);
    expect(mockedPartyRepo.reassignPartyCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ id: "party-123" }),
      { kind: "set", value: "" },
      undefined,
      "user-123"
    );
  });

  it("returns 400 when campaignId exceeds the entity-id length limit", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "x".repeat(201),
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.loadParties).not.toHaveBeenCalled();
  });

  it("returns 400 when description is not a string, without hitting storage", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        description: 42,
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.loadParties).not.toHaveBeenCalled();
  });

  it("returns 400 when body is not a plain object", async () => {
    for (const badBody of [null, [], "a string", 42]) {
      const response = await PUT(
        makeRouteRequest("http://localhost/api/parties/party-123", "PUT", badBody),
        { params: Promise.resolve({ id: "party-123" }) }
      );
      expect(response.status).toBe(400);
    }
  });

  it("returns 403 when reassignPartyCampaign rejects with PartyCampaignAuthorizationError", async () => {
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.reassignPartyCampaign.mockRejectedValueOnce(
      new PartyCampaignAuthorizationError("camp-1", "user-123")
    );

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-1",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 404 when party not found", async () => {
    mockedPartyRepo.loadParties.mockResolvedValue([]);
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/missing", "PUT", { name: "X" }),
      { params: Promise.resolve({ id: "missing" }) }
    );
    expect(response.status).toBe(404);
  });

  it("B3-1: returns 403 when adding unshared character to campaign party", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(false);

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
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);

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
    expect((mockedPartyRepo as any).canAddToCampaignParty).not.toHaveBeenCalled();
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
    expect((mockedPartyRepo as any).canAddToCampaignParty).not.toHaveBeenCalled();
  });

  it("B4-1: re-validates existing members' sharing when moving to a new campaign without characterIds, and rejects if unshared", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect((mockedPartyRepo as any).canAddToCampaignParty).toHaveBeenCalledWith("camp-2", "char-1", "user-123");
    expect(mockedPartyRepo.reassignPartyCampaign).not.toHaveBeenCalled();
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("B4-2: allows moving to a new campaign without characterIds when existing members are shared there", async () => {
    const partyWithCampaign = { ...EXISTING_PARTY, campaignId: "camp-1" };
    mockedPartyRepo.loadParties.mockResolvedValue([partyWithCampaign] as any);
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
    expect((mockedPartyRepo as any).canAddToCampaignParty).toHaveBeenCalledWith("camp-2", "char-1", "user-123");
  });

  it("B4-3: re-checks sharing against the live-resolved campaign even when the party's own campaignId field is stale/absent", async () => {
    // Simulates a party that has already migrated to campaigns.partyIds:
    // the deprecated campaignId field on the party document is gone, but
    // the party is still live-linked to a campaign.
    mockedPartyRepo.loadParties.mockResolvedValue([{ ...EXISTING_PARTY, campaignId: undefined }] as any);
    (mockedPartyRepo as any).getCurrentCampaignId.mockResolvedValue("camp-1");
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-1", "char-new-unshared"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect((mockedPartyRepo as any).canAddToCampaignParty).toHaveBeenCalledWith("camp-1", "char-new-unshared", "user-123");
  });

  it("B4-4: rejects a campaign link before running the sharing check when caller is not an active DM of the new campaign", async () => {
    (mockedPartyRepo as any).isActiveDm.mockResolvedValue(false);

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-2",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(403);
    expect((mockedPartyRepo as any).canAddToCampaignParty).not.toHaveBeenCalled();
    expect(mockedPartyRepo.reassignPartyCampaign).not.toHaveBeenCalled();
  });

  it("B4-5: rolls back the campaign reassignment if saveParty fails afterward", async () => {
    (mockedPartyRepo as any).getCurrentCampaignId.mockResolvedValue(undefined);
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
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

  it("returns 400 when characterIds contains a non-string element", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-1", 42],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("characterIds");
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 when characterIds is supplied but not an array, without hitting storage", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: "not-an-array",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(400);
    expect(mockedPartyRepo.loadParties).not.toHaveBeenCalled();
  });
});

describe("GET /api/parties/[id]", () => {
  const PARAMS = Promise.resolve({ id: "party-123" });
  const makeReq = () => makeRouteRequest("http://localhost/api/parties/party-123", "GET");

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue([
      { id: "party-123", userId: "user-123", name: "Fellowship", members: [] },
    ] as any);
  });

  itReturns401WithParams(GET_ONE, makeReq, PARAMS);

  it("returns party when found", async () => {
    const response = await GET_ONE(makeReq(), { params: PARAMS });
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe("Fellowship");
  });

  itReturns404WithParams(
    GET_ONE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockResolvedValue([])
  );

  itReturns500WithParams(
    GET_ONE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockRejectedValue(new Error("DB error"))
  );
});

describe("DELETE /api/parties/[id]", () => {
  const PARAMS = Promise.resolve({ id: "party-123" });
  const makeReq = () => makeRouteRequest("http://localhost/api/parties/party-123", "DELETE");

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue([
      { id: "party-123", userId: "user-123", name: "Fellowship", members: [] },
    ] as any);
    mockedPartyRepo.deleteParty.mockResolvedValue(undefined as any);
  });

  itReturns401WithParams(DELETE, makeReq, PARAMS);

  it("deletes party and returns 200", async () => {
    const response = await DELETE(makeReq(), { params: PARAMS });
    expect(response.status).toBe(200);
    expect(mockedPartyRepo.deleteParty).toHaveBeenCalledWith("party-123", "user-123");
  });

  itReturns404WithParams(
    DELETE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockResolvedValue([])
  );

  itReturns500WithParams(
    DELETE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockRejectedValue(new Error("DB error"))
  );
});
