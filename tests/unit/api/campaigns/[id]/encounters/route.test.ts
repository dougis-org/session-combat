/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/campaigns/[id]/encounters/route";
import { storage } from "@/lib/storage";
import { Campaign, CampaignMember, Encounter } from "@/lib/types";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
  itReturns401WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    loadCampaignByIdAny: jest.fn(),
    loadEncountersByIds: jest.fn(),
    addEncounterToCampaign: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  loadCampaignByIdAny: jest.MockedFunction<typeof storage.loadCampaignByIdAny>;
  loadEncountersByIds: jest.MockedFunction<typeof storage.loadEncountersByIds>;
  addEncounterToCampaign: jest.MockedFunction<typeof storage.addEncounterToCampaign>;
};

const CAMPAIGN_ID = "camp-1";
const DM_ID = "dm-user";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const ACTIVE_DM: CampaignMember = {
  id: "mem-dm",
  campaignId: CAMPAIGN_ID,
  userId: DM_ID,
  role: "dm",
  status: "active",
  history: [],
};

const ACTIVE_PLAYER: CampaignMember = {
  id: "mem-player",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "active",
  history: [],
};

const CAMPAIGN: Campaign = {
  id: CAMPAIGN_ID,
  userId: DM_ID,
  name: "The Sunless Citadel",
  moduleName: "sunless-citadel",
  chapters: [],
  encounterIds: ["e1", "e2"],
  status: "active",
  notes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ENCOUNTERS: Encounter[] = [
  { id: "e1", userId: DM_ID, name: "Goblins", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
  { id: "e2", userId: DM_ID, name: "Kobolds", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
];

const makeGetRequest = () =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/encounters`, "GET");

const makePostRequest = (body: unknown) =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/encounters`, "POST", body);

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
});

describe("GET /api/campaigns/[id]/encounters", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(GET, makeGetRequest, PARAMS);
  });

  it("DM fetches linked encounters", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockResolvedValue(ENCOUNTERS);

    const response = await GET(makeGetRequest(), { params: PARAMS });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(mockedStorage.loadEncountersByIds).toHaveBeenCalledWith(["e1", "e2"], DM_ID);
  });

  it("Player member fetches the same linked encounters, not filtered by their own userId", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockResolvedValue(ENCOUNTERS);

    const response = await GET(makeGetRequest(), { params: PARAMS });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(mockedStorage.loadEncountersByIds).toHaveBeenCalledWith(["e1", "e2"], DM_ID);
  });

  it("Non-member is rejected", async () => {
    mockedStorage.getMember.mockResolvedValue(null);

    const response = await GET(makeGetRequest(), { params: PARAMS });

    expect(response.status).toBe(404);
  });

  it("Empty encounterIds returns empty list", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue({ ...CAMPAIGN, encounterIds: [] });
    mockedStorage.loadEncountersByIds.mockResolvedValue([]);

    const response = await GET(makeGetRequest(), { params: PARAMS });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("returns 500 when loadEncountersByIds throws", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockRejectedValue(new Error("Storage error"));

    const response = await GET(makeGetRequest(), { params: PARAMS });

    expect(response.status).toBe(500);
  });

  it("returns 400 when id param is an empty string", async () => {
    const response = await GET(makeGetRequest(), { params: Promise.resolve({ id: "" }) });

    expect(response.status).toBe(400);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
  });
});

describe("POST /api/campaigns/[id]/encounters", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(POST, () => makePostRequest({ encounterId: "e3" }), PARAMS);
  });

  it("DM links an owned encounter", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockResolvedValue([
      { id: "e3", userId: DM_ID, name: "Owlbear", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockedStorage.addEncounterToCampaign.mockResolvedValue(undefined);

    const response = await POST(makePostRequest({ encounterId: "e3" }), { params: PARAMS });

    expect([200, 201]).toContain(response.status);
    expect(mockedStorage.addEncounterToCampaign).toHaveBeenCalledWith(CAMPAIGN_ID, "e3", DM_ID);
  });

  it("Linking the same encounter twice is idempotent", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockResolvedValue([ENCOUNTERS[0]]);
    mockedStorage.addEncounterToCampaign.mockResolvedValue(undefined);

    const response = await POST(makePostRequest({ encounterId: "e1" }), { params: PARAMS });

    expect([200, 201]).toContain(response.status);
  });

  it("Linking an encounter you don't own is rejected", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockResolvedValue([]);

    const response = await POST(makePostRequest({ encounterId: "e9" }), { params: PARAMS });

    expect(response.status).toBe(404);
    expect(mockedStorage.addEncounterToCampaign).not.toHaveBeenCalled();
  });

  it("Player member cannot link", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);

    const response = await POST(makePostRequest({ encounterId: "e3" }), { params: PARAMS });

    expect(response.status).toBe(404);
    expect(mockedStorage.addEncounterToCampaign).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON body", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);

    const request = new (require("next/server").NextRequest)(
      `http://localhost/api/campaigns/${CAMPAIGN_ID}/encounters`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
        body: "{not valid json",
      }
    );

    const response = await POST(request, { params: PARAMS });

    expect(response.status).toBe(400);
    expect(mockedStorage.addEncounterToCampaign).not.toHaveBeenCalled();
  });

  it("returns 400 when body is not an object", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);

    const response = await POST(makePostRequest(["not", "an", "object"]), { params: PARAMS });

    expect(response.status).toBe(400);
    expect(mockedStorage.addEncounterToCampaign).not.toHaveBeenCalled();
  });

  it("returns 400 when encounterId is omitted", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };

    const response = await POST(makePostRequest({}), { params: PARAMS });

    expect(response.status).toBe(400);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
  });

  it("returns 400 when encounterId is an empty string", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };

    const response = await POST(makePostRequest({ encounterId: "   " }), { params: PARAMS });

    expect(response.status).toBe(400);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
  });

  it("returns 500 when addEncounterToCampaign throws", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.loadEncountersByIds.mockResolvedValue([
      { id: "e3", userId: DM_ID, name: "Owlbear", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockedStorage.addEncounterToCampaign.mockRejectedValue(new Error("Storage error"));

    const response = await POST(makePostRequest({ encounterId: "e3" }), { params: PARAMS });

    expect(response.status).toBe(500);
  });
});
