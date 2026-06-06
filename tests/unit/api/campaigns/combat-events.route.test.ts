/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { GET } from "@/app/api/campaigns/[id]/combat-events/route";
import { getDatabase } from "@/lib/db";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import {
  MOCK_AUTH,
  mockDbCollection,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns500WithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").mockMiddleware);
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
jest.mock("@/lib/utils/campaign", () => ({
  ...jest.requireActual("@/lib/utils/campaign"),
  assertCampaignAccess: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);
const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);

const MOCK_CAMPAIGN = { id: "camp-abc", userId: "user-123", name: "Test", chapters: [], status: "active" as const, notes: "" };

const CAMPAIGN_ID = "camp-abc";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/combat-events`;
const params = Promise.resolve({ id: CAMPAIGN_ID });
const makeGetReq = (qs = "") =>
  makeRouteRequest(`${BASE_URL}${qs}`, "GET");

const makeFind = (docs: unknown[]) =>
  jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(docs) });

const MOCK_DOC = {
  id: "cs-1",
  userId: "user-123",
  campaignId: CAMPAIGN_ID,
  encounterId: "enc-1",
  encounterDescription: "Bandit ambush",
  currentRound: 4,
  isActive: false,
  completedAt: new Date("2026-05-10T12:00:00Z"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
});

describe("GET /api/campaigns/[id]/combat-events", () => {
  itReturns401WithParams(GET, makeGetReq, params);

  it("returns 404 when non-member accesses combat events", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await GET(makeGetReq(), { params });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Campaign not found");
  });

  it("returns 200 with events for active player member", async () => {
    mockDbCollection(mockedGetDatabase, { find: makeFind([MOCK_DOC]) });
    const res = await GET(makeGetReq(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].type).toBe("combat_completed");
  });

  it("returns empty array when no documents match", async () => {
    mockDbCollection(mockedGetDatabase, { find: makeFind([]) });

    const res = await GET(makeGetReq(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("maps combat state to SessionEvent correctly", async () => {
    mockDbCollection(mockedGetDatabase, { find: makeFind([MOCK_DOC]) });

    const res = await GET(makeGetReq(), { params });
    expect(res.status).toBe(200);
    const [event] = await res.json();

    expect(event.type).toBe("combat_completed");
    expect(event.description).toBe("Combat: Bandit ambush (3 rounds)");
    expect(event.rounds).toBe(3);
    expect(event.encounterId).toBe("enc-1");
    expect(event.encounterDescription).toBe("Bandit ambush");
    expect(event.campaignId).toBe(CAMPAIGN_ID);
  });

  it("uses 'Unnamed encounter' when encounterDescription is absent", async () => {
    const doc = { ...MOCK_DOC, encounterDescription: undefined };
    mockDbCollection(mockedGetDatabase, { find: makeFind([doc]) });

    const res = await GET(makeGetReq(), { params });
    const [event] = await res.json();
    expect(event.description).toBe("Combat: Unnamed encounter (3 rounds)");
  });

  it("filters by since query param", async () => {
    const find = makeFind([]);
    mockDbCollection(mockedGetDatabase, { find });

    const since = "2026-01-01T00:00:00.000Z";
    await GET(makeGetReq(`?since=${encodeURIComponent(since)}`), { params });

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        completedAt: { $gte: new Date(since) },
      })
    );
  });

  it("falls back to epoch when since param is invalid", async () => {
    const find = makeFind([]);
    mockDbCollection(mockedGetDatabase, { find });

    await GET(makeGetReq("?since=not-a-date"), { params });

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        completedAt: { $gte: new Date(0) },
      })
    );
  });

  it("scopes query to userId and campaignId", async () => {
    const find = makeFind([]);
    mockDbCollection(mockedGetDatabase, { find });

    await GET(makeGetReq(), { params });

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        campaignId: CAMPAIGN_ID,
        isActive: false,
      })
    );
  });

  itReturns500WithParams(
    GET,
    makeGetReq,
    params,
    () =>
      mockDbCollection(mockedGetDatabase, {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockRejectedValue(new Error("DB error")),
        }),
      })
  );
});
