/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { PATCH, DELETE } from "@/app/api/campaigns/[id]/sessions/[sessionId]/route";
import { storage } from "@/lib/storage";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import {
  MOCK_AUTH,
  MOCK_SESSION_LOG,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage", () => ({
  storage: {
    updateSessionLog: jest.fn(),
    deleteSessionLog: jest.fn(),
  },
}));
jest.mock("@/lib/utils/campaign", () => ({
  ...jest.requireActual("@/lib/utils/campaign"),
  assertCampaignAccess: jest.fn(),
}));

const mockedStorage = jest.mocked(storage);
const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);

const CAMPAIGN_ID = "campaign-1";
const SESSION_ID = "log-1";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/sessions/${SESSION_ID}`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID, sessionId: SESSION_ID });

const MOCK_CAMPAIGN = { id: CAMPAIGN_ID, userId: "user-123", name: "Test Campaign", chapters: [], status: "active" as const, notes: "" };

const makePatchReq = (body: unknown) => makeRouteRequest(BASE_URL, "PATCH", body);
const makeDeleteReq = () => makeRouteRequest(BASE_URL, "DELETE");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "dm" });
});

// ─── PATCH /api/campaigns/[id]/sessions/[sessionId] ───────────────────────────

describe("PATCH /api/campaigns/[id]/sessions/[sessionId]", () => {
  itReturns401WithParams(PATCH, () => makePatchReq({ title: "Updated" }), PARAMS);

  it("returns 200 with updated log for DM", async () => {
    const updated = { ...MOCK_SESSION_LOG, title: "Updated Title" };
    mockedStorage.updateSessionLog.mockResolvedValue(updated as any);
    const res = await PATCH(makePatchReq({ title: "Updated Title" }), { params: PARAMS });
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Updated Title");
    expect(mockedStorage.updateSessionLog).toHaveBeenCalledWith(
      SESSION_ID, MOCK_CAMPAIGN.userId, CAMPAIGN_ID, expect.any(Object)
    );
  });

  it("whitelists only allowed fields — does not pass campaignId to storage", async () => {
    mockedStorage.updateSessionLog.mockResolvedValue(MOCK_SESSION_LOG as any);
    await PATCH(
      makePatchReq({ title: "Safe", campaignId: "hacked-campaign" }),
      { params: PARAMS }
    );
    const patch = (mockedStorage.updateSessionLog as jest.Mock).mock.calls[0][3];
    expect(patch.campaignId).toBeUndefined();
    expect(patch.title).toBe("Safe");
  });

  it("returns 404 when active player attempts PATCH", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
    const res = await PATCH(makePatchReq({ title: "X" }), { params: PARAMS });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Campaign not found");
  });

  it("returns 404 when non-member attempts PATCH", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await PATCH(makePatchReq({ title: "X" }), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  itReturns404WithParams(
    PATCH,
    () => makePatchReq({ title: "X" }),
    PARAMS,
    () => mockedStorage.updateSessionLog.mockResolvedValue(null),
    "returns 404 when session log not found"
  );

  itReturns500WithParams(
    PATCH,
    () => makePatchReq({ title: "X" }),
    PARAMS,
    () => mockedStorage.updateSessionLog.mockRejectedValue(new Error("DB error"))
  );
});

// ─── DELETE /api/campaigns/[id]/sessions/[sessionId] ──────────────────────────

describe("DELETE /api/campaigns/[id]/sessions/[sessionId]", () => {
  itReturns401WithParams(DELETE, makeDeleteReq, PARAMS);

  it("returns 200 when DM deletes a session log", async () => {
    mockedStorage.deleteSessionLog.mockResolvedValue(true as any);
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(200);
    expect(mockedStorage.deleteSessionLog).toHaveBeenCalledWith(SESSION_ID, MOCK_CAMPAIGN.userId, CAMPAIGN_ID);
  });

  it("returns 404 when active player attempts DELETE", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Campaign not found");
    expect(mockedStorage.deleteSessionLog).not.toHaveBeenCalled();
  });

  it("returns 404 when non-member attempts DELETE", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(404);
    expect(mockedStorage.deleteSessionLog).not.toHaveBeenCalled();
  });

  itReturns404WithParams(
    DELETE,
    makeDeleteReq,
    PARAMS,
    () => mockedStorage.deleteSessionLog.mockResolvedValue(null as any),
    "returns 404 when session log not found"
  );

  itReturns500WithParams(
    DELETE,
    makeDeleteReq,
    PARAMS,
    () => mockedStorage.deleteSessionLog.mockRejectedValue(new Error("DB error"))
  );
});
