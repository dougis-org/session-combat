import { PATCH, DELETE } from "@/app/api/campaigns/[id]/sessions/[sessionId]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware");
jest.mock("@/lib/storage", () => ({
  storage: {
    updateSessionLog: jest.fn(),
    deleteSessionLog: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const CAMPAIGN_ID = "campaign-1";
const SESSION_ID = "log-1";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/sessions/${SESSION_ID}`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID, sessionId: SESSION_ID });

const makePatchReq = (body: unknown) => makeRouteRequest(BASE_URL, "PATCH", body);
const makeDeleteReq = () => makeRouteRequest(BASE_URL, "DELETE");

const MOCK_LOG = {
  id: SESSION_ID,
  userId: "user-123",
  campaignId: CAMPAIGN_ID,
  sessionNumber: 1,
  datePlayed: new Date("2026-05-01"),
  events: [],
  milestone: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAuth.mockReturnValue(MOCK_AUTH);
});

// ─── PATCH /api/campaigns/[id]/sessions/[sessionId] ───────────────────────────

describe("PATCH /api/campaigns/[id]/sessions/[sessionId]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      new (await import("next/server")).NextResponse(null, { status: 401 })
    );
    const res = await PATCH(makePatchReq({ title: "Updated" }), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it("returns 200 with updated log", async () => {
    const updated = { ...MOCK_LOG, title: "Updated Title" };
    mockedStorage.updateSessionLog.mockResolvedValue(updated as any);
    const res = await PATCH(makePatchReq({ title: "Updated Title" }), { params: PARAMS });
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Updated Title");
  });

  it("whitelists only allowed fields — does not pass campaignId to storage", async () => {
    mockedStorage.updateSessionLog.mockResolvedValue(MOCK_LOG as any);
    await PATCH(
      makePatchReq({ title: "Safe", campaignId: "hacked-campaign" }),
      { params: PARAMS }
    );
    const patch = (mockedStorage.updateSessionLog as jest.Mock).mock.calls[0][3];
    expect(patch.campaignId).toBeUndefined();
    expect(patch.title).toBe("Safe");
  });

  it("returns 404 when session log not found", async () => {
    mockedStorage.updateSessionLog.mockResolvedValue(null);
    const res = await PATCH(makePatchReq({ title: "X" }), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it("returns 500 on error", async () => {
    mockedStorage.updateSessionLog.mockRejectedValue(new Error("DB error"));
    const res = await PATCH(makePatchReq({ title: "X" }), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/campaigns/[id]/sessions/[sessionId] ──────────────────────────

describe("DELETE /api/campaigns/[id]/sessions/[sessionId]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      new (await import("next/server")).NextResponse(null, { status: 401 })
    );
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it("returns 200 when deleted", async () => {
    mockedStorage.deleteSessionLog.mockResolvedValue(true as any);
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(200);
    expect(mockedStorage.deleteSessionLog).toHaveBeenCalledWith(SESSION_ID, "user-123", CAMPAIGN_ID);
  });

  it("returns 404 when session log not found", async () => {
    mockedStorage.deleteSessionLog.mockResolvedValue(null as any);
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it("returns 500 on error", async () => {
    mockedStorage.deleteSessionLog.mockRejectedValue(new Error("DB error"));
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});
