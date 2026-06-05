/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { GET, POST } from "@/app/api/campaigns/[id]/sessions/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import {
  MOCK_AUTH,
  MOCK_SESSION_LOG,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware");
jest.mock("@/lib/storage", () => ({
  storage: {
    loadSessionLogs: jest.fn(),
    saveSessionLog: jest.fn(),
    getNextSessionNumber: jest.fn(),
  },
}));
jest.mock("@/lib/utils/campaign", () => ({
  ...jest.requireActual("@/lib/utils/campaign"),
  assertCampaignAccess: jest.fn(),
}));
jest.mock("crypto", () => ({ randomUUID: jest.fn(() => "test-uuid") }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);
const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);

const CAMPAIGN_ID = "campaign-1";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/sessions`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });
const makeGetReq = () => makeRouteRequest(BASE_URL, "GET");
const makePostReq = (body: unknown) => makeRouteRequest(BASE_URL, "POST", body);

const MOCK_CAMPAIGN = { id: CAMPAIGN_ID, userId: "user-123", name: "Test Campaign", chapters: [], status: "active" as const, notes: "" };

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAuth.mockReturnValue(MOCK_AUTH);
  mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "dm" });
});

// ─── GET /api/campaigns/[id]/sessions ─────────────────────────────────────────

describe("GET /api/campaigns/[id]/sessions", () => {
  itReturns401WithParams(GET, makeGetReq, PARAMS, mockedRequireAuth);

  it("returns 200 with session logs for active player", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
    mockedStorage.loadSessionLogs.mockResolvedValue([MOCK_SESSION_LOG] as any);
    const res = await GET(makeGetReq(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].sessionNumber).toBe(1);
  });

  it("returns 200 with empty array when no logs", async () => {
    mockedStorage.loadSessionLogs.mockResolvedValue([]);
    const res = await GET(makeGetReq(), { params: PARAMS });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 404 when assertCampaignAccess denies (non-member)", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await GET(makeGetReq(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  itReturns500WithParams(
    GET,
    makeGetReq,
    PARAMS,
    () => mockedStorage.loadSessionLogs.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});

// ─── POST /api/campaigns/[id]/sessions ────────────────────────────────────────

describe("POST /api/campaigns/[id]/sessions", () => {
  beforeEach(() => {
    mockedStorage.saveSessionLog.mockResolvedValue(undefined as any);
    mockedStorage.getNextSessionNumber.mockResolvedValue(2);
  });

  itReturns401WithParams(POST, () => makePostReq({ datePlayed: "2026-05-01" }), PARAMS, mockedRequireAuth);

  it("returns 400 when datePlayed is missing", async () => {
    const res = await POST(makePostReq({ title: "Session 1" }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 201 and creates log with auto-incremented sessionNumber", async () => {
    const res = await POST(
      makePostReq({ datePlayed: "2026-05-01", title: "First Session" }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sessionNumber).toBe(2);
    expect(body.title).toBe("First Session");
    expect(body.milestone).toBe(false);
    expect(mockedStorage.saveSessionLog).toHaveBeenCalledTimes(1);
  });

  it("uses provided sessionNumber when valid positive integer", async () => {
    const res = await POST(
      makePostReq({ datePlayed: "2026-05-01", sessionNumber: 5 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    expect((await res.json()).sessionNumber).toBe(5);
    expect(mockedStorage.getNextSessionNumber).not.toHaveBeenCalled();
  });

  it("ignores NaN sessionNumber and falls back to auto-increment", async () => {
    const res = await POST(
      makePostReq({ datePlayed: "2026-05-01", sessionNumber: NaN }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    expect((await res.json()).sessionNumber).toBe(2);
  });

  it("accepts sessionNumber 0 (session zero is valid for intro sessions)", async () => {
    const res = await POST(
      makePostReq({ datePlayed: "2026-05-01", sessionNumber: 0 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    expect((await res.json()).sessionNumber).toBe(0);
    expect(mockedStorage.getNextSessionNumber).not.toHaveBeenCalled();
  });

  it("only persists newLevel when milestone is true", async () => {
    const res = await POST(
      makePostReq({ datePlayed: "2026-05-01", milestone: false, newLevel: 5 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    expect((await res.json()).newLevel).toBeUndefined();
  });

  it("sets milestone true and newLevel when provided", async () => {
    const res = await POST(
      makePostReq({ datePlayed: "2026-05-01", milestone: true, newLevel: 5 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.milestone).toBe(true);
    expect(body.newLevel).toBe(5);
  });

  it("returns 404 when active player attempts POST", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
    const res = await POST(makePostReq({ datePlayed: "2026-05-01" }), { params: PARAMS });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Campaign not found");
  });

  it("returns 404 when assertCampaignAccess denies (non-member)", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await POST(makePostReq({ datePlayed: "2026-05-01" }), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  itReturns500WithParams(
    POST,
    () => makePostReq({ datePlayed: "2026-05-01" }),
    PARAMS,
    () => mockedStorage.saveSessionLog.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});
