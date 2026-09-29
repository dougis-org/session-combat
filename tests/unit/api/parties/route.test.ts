/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/parties/route";
import { GET as GET_ONE, PUT, DELETE } from "@/app/api/parties/[id]/route";
import * as partyRepo from "@/lib/storage/partyRepo";
import { PartyCampaignAuthorizationError } from "@/lib/storage/errors";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
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
  addPartyToCampaign: jest.fn(),
  removePartyFromCampaign: jest.fn(),
  removePartyFromAllCampaigns: jest.fn(),
  reassignPartyCampaign: jest.fn(),
}));

const mockedPartyRepo = jest.mocked(partyRepo);

const MOCK_PARTIES = [
  { id: "party-1", userId: "user-123", name: "Fellowship", members: [] },
];

const BASE_URL = "http://localhost/api/parties";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest());

  it("returns list of parties", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue(MOCK_PARTIES as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Fellowship");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockedPartyRepo.loadParties.mockRejectedValue(new Error("Storage error"))
  );
});

describe("POST /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(POST, () => makeRequest({ name: "Crew" }));

  it("returns 400 when name is missing", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ characterIds: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "  " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is a non-string type", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: 123 }));
    expect(response.status).toBe(400);
  });

  it("creates party and returns 201", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({
        name: "The Avengers",
        description: "Earth's mightiest heroes",
        characterIds: ["char-1", "char-2"],
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("The Avengers");
    expect(body.userId).toBe("user-123");
    expect(body.members).toHaveLength(2);
    expect(body.members.map((m: { characterId: string }) => m.characterId)).toEqual(["char-1", "char-2"]);
    expect(mockedPartyRepo.saveParty).toHaveBeenCalledTimes(1);
    const savedParty = (mockedPartyRepo.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty._id).toBeUndefined();
    expect(savedParty.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  itReturns500(
    POST,
    () => makeRequest({ name: "Doomed Party" }),
    () => mockedPartyRepo.saveParty.mockRejectedValue(new Error("Storage error"))
  );

  it("B2-1: returns 403 when campaignId set and character not shared", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(false);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: ["char-foreign"] })
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("not shared");
  });

  it("B2-2: returns 201 when campaignId set and shared character allowed", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: ["char-shared"] })
    );

    expect(response.status).toBe(201);
  });

  it("B2-3: no share check when campaignId absent", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "No Campaign", characterIds: ["char-1"] }));

    expect(response.status).toBe(201);
    expect((mockedPartyRepo as any).canAddToCampaignParty).not.toHaveBeenCalled();
  });

  it("returns 400 when characterIds is not an array", async () => {
    mockAuthState.payload = MOCK_AUTH;

    const response = await POST(makeRequest({ name: "Bad Ids", characterIds: "not-an-array" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("characterIds");
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 when characterIds contains a non-string element", async () => {
    mockAuthState.payload = MOCK_AUTH;

    const response = await POST(makeRequest({ name: "Bad Ids", characterIds: ["char-1", 42] }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("characterIds");
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 for each non-string, non-undefined campaignId type", async () => {
    mockAuthState.payload = MOCK_AUTH;
    for (const badValue of [null, 42, true, [], {}]) {
      const response = await POST(makeRequest({ name: "Party", campaignId: badValue }));
      expect(response.status).toBe(400);
    }
  });

  it("returns 400 when description is not a string", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "Party", description: 42 }));
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("no share check or campaign link when campaignId is omitted", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "No Campaign" }));

    expect(response.status).toBe(201);
    expect(mockedPartyRepo.addPartyToCampaign).not.toHaveBeenCalled();
  });

  it("returns 403 and rolls back when addPartyToCampaign rejects with PartyCampaignAuthorizationError", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);
    mockedPartyRepo.addPartyToCampaign.mockRejectedValueOnce(
      new PartyCampaignAuthorizationError("camp-1", "user-123")
    );
    mockedPartyRepo.deleteParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: [] })
    );

    expect(response.status).toBe(403);
    expect(mockedPartyRepo.deleteParty).toHaveBeenCalledTimes(1);
  });
});

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
      " camp-1 ",
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
      "",
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
