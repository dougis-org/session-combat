/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/encounters/route";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage", () => ({
  storage: {
    loadEncounters: jest.fn(),
    saveEncounter: jest.fn(),
    getMember: jest.fn(),
    loadCampaignByIdAny: jest.fn(),
    addEncounterToCampaign: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage);

const MOCK_ENCOUNTERS = [
  { id: "enc-1", userId: "user-123", name: "Goblin Ambush", monsters: [] },
];

const BASE_URL = "http://localhost/api/encounters";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/encounters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest());

  it("returns list of encounters", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedStorage.loadEncounters.mockResolvedValue(MOCK_ENCOUNTERS as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Goblin Ambush");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error"))
  );
});

describe("POST /api/encounters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(POST, () => makeRequest({ name: "Test" }));

  it("returns 400 when name is missing", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ monsters: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "   " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const request = new (require("next/server").NextRequest)(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
      body: "{not valid json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockedStorage.saveEncounter).not.toHaveBeenCalled();
  });

  it("returns 400 when body is not an object", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest(["not", "an", "object"]));
    expect(response.status).toBe(400);
    expect(mockedStorage.saveEncounter).not.toHaveBeenCalled();
  });

  it("returns 400 when monsters is not an array", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "Test", monsters: "not-an-array" }));
    expect(response.status).toBe(400);
    expect(mockedStorage.saveEncounter).not.toHaveBeenCalled();
  });

  it("creates encounter and returns 201", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedStorage.saveEncounter.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Dragon Lair", description: "Scary", monsters: [] })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Dragon Lair");
    expect(body.userId).toBe("user-123");
    expect(body.description).toBe("Scary");
    expect(mockedStorage.saveEncounter).toHaveBeenCalledTimes(1);
  });

  itReturns500(
    POST,
    () => makeRequest({ name: "Valid Name" }),
    () => mockedStorage.saveEncounter.mockRejectedValue(new Error("Storage error"))
  );
});

describe("POST /api/encounters with campaignId", () => {
  const CAMPAIGN_ID = "camp-1";
  const DM_MEMBER = {
    id: "mem-dm",
    campaignId: CAMPAIGN_ID,
    userId: "user-123",
    role: "dm" as const,
    status: "active" as const,
    history: [],
  };
  const PLAYER_MEMBER = { ...DM_MEMBER, role: "player" as const };
  const CAMPAIGN = {
    id: CAMPAIGN_ID,
    userId: "user-123",
    name: "Test Campaign",
    moduleName: "mod",
    chapters: [],
    encounterIds: [],
    status: "active" as const,
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
  });

  it("Create and link succeeds", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.saveEncounter.mockResolvedValue(undefined as any);
    mockedStorage.addEncounterToCampaign.mockResolvedValue(undefined);

    const response = await POST(makeRequest({ name: "Goblin Ambush", campaignId: CAMPAIGN_ID }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Goblin Ambush");
    expect(mockedStorage.addEncounterToCampaign).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      body.id,
      "user-123"
    );
  });

  it("campaignId omitted behaves exactly as before", async () => {
    mockedStorage.saveEncounter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "No Campaign" }));

    expect(response.status).toBe(201);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
    expect(mockedStorage.addEncounterToCampaign).not.toHaveBeenCalled();
  });

  it("Requester is not the campaign's DM", async () => {
    mockedStorage.getMember.mockResolvedValue(PLAYER_MEMBER);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);

    const response = await POST(makeRequest({ name: "Trap Room", campaignId: CAMPAIGN_ID }));

    expect(response.status).toBe(404);
    expect(mockedStorage.saveEncounter).not.toHaveBeenCalled();
  });

  it("Encounter creation succeeds but linking fails", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.saveEncounter.mockResolvedValue(undefined as any);
    mockedStorage.addEncounterToCampaign.mockRejectedValue(new Error("link failed"));

    const response = await POST(makeRequest({ name: "Owlbear Den", campaignId: CAMPAIGN_ID }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Owlbear Den");
    expect(body.linkWarning).toEqual(expect.any(String));
  });
});
