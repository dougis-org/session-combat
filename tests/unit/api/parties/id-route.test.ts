/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/parties/[id]/route";
import * as partyRepo from "@/lib/storage/partyRepo";
import { PartyCampaignAuthorizationError } from "@/lib/storage/errors";
import {
  MOCK_AUTH,
  makeRouteRequest,
  makeMalformedJsonRequest,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/partyRepo", () => ({
  loadParties: jest.fn(),
  saveParty: jest.fn(),
  deleteParty: jest.fn(),
  canAddToCampaignParty: jest.fn(),
  reassignPartyCampaign: jest.fn(),
  getLinkedCampaignIds: jest.fn(),
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
    mockedPartyRepo.getLinkedCampaignIds.mockImplementation(
      async (_partyId: string, legacyCampaignId?: string) => (legacyCampaignId ? [legacyCampaignId] : [])
    );
    mockedPartyRepo.isActiveDm.mockResolvedValue(true);
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

  it("returns 400 when the id path param is empty or whitespace-only, without hitting storage", async () => {
    for (const badId of ["", "   "]) {
      const response = await PUT(
        makeRouteRequest(`http://localhost/api/parties/${encodeURIComponent(badId)}`, "PUT", { name: "Name" }),
        { params: Promise.resolve({ id: badId }) }
      );
      expect(response.status).toBe(400);
    }
    expect(mockedPartyRepo.loadParties).not.toHaveBeenCalled();
  });

  it("returns 400 when the id path param exceeds the entity-id length limit, without hitting storage", async () => {
    const longId = "x".repeat(201);
    const response = await PUT(
      makeRouteRequest(`http://localhost/api/parties/${longId}`, "PUT", { name: "Name" }),
      { params: Promise.resolve({ id: longId }) }
    );
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.loadParties).not.toHaveBeenCalled();
  });

  it("returns 400 (not 500) when the request body is malformed JSON", async () => {
    const response = await PUT(
      makeMalformedJsonRequest("http://localhost/api/parties/party-123", "PUT"),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.loadParties).not.toHaveBeenCalled();
  });

  it("returns 400 when name is blank", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", { name: "  " }),
      { params: Promise.resolve({ id: "party-123" }) }
    );
    expect(response.status).toBe(400);
  });

  it("sets campaignId when non-empty string provided", async () => {
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(true);
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
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(true);
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

  it("returns 500 (not 403) when reassignPartyCampaign rejects with a generic error", async () => {
    mockedPartyRepo.canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.reassignPartyCampaign.mockRejectedValueOnce(new Error("db blip"));

    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        campaignId: "camp-1",
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(500);
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

  it("returns 400 when a characterIds element is an empty string", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["char-1", ""],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(400);
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 when a characterIds element exceeds the entity-id length limit", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "Name",
        characterIds: ["x".repeat(201)],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(400);
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
