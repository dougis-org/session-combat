/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { POST, DELETE } from "@/app/api/campaigns/[id]/sessions/active/route";
import { storage } from "@/lib/storage";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns500WithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage", () => ({
  storage: {
    getNextSessionNumber: jest.fn(),
    saveSessionLog: jest.fn(),
    setActiveCampaignSession: jest.fn(),
  },
}));
jest.mock("@/lib/utils/campaign", () => ({
  ...jest.requireActual("@/lib/utils/campaign"),
  assertCampaignAccess: jest.fn(),
}));
const mockRandomUUID = jest.fn(() => "new-session-uuid");
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: mockRandomUUID },
  writable: true,
});

const mockedStorage = jest.mocked(storage);
const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);

const CAMPAIGN_ID = "campaign-1";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/sessions/active`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const MOCK_CAMPAIGN = {
  id: CAMPAIGN_ID,
  userId: "user-123",
  name: "Test Campaign",
  chapters: [],
  status: "active" as const,
  notes: "",
  activeSessionId: undefined as string | null | undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePostReq = () => makeRouteRequest(BASE_URL, "POST");
const makeDeleteReq = (force?: boolean) =>
  makeRouteRequest(force ? `${BASE_URL}?force=true` : BASE_URL, "DELETE");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "dm" });
  mockedStorage.getNextSessionNumber.mockResolvedValue(1);
  mockedStorage.saveSessionLog.mockResolvedValue(undefined as any);
  mockedStorage.setActiveCampaignSession.mockResolvedValue(undefined as any);
});

// ─── POST /api/campaigns/[id]/sessions/active ────────────────────────────────

describe("POST /api/campaigns/[id]/sessions/active", () => {
  itReturns401WithParams(POST, makePostReq, PARAMS);

  it("returns 201 and the new SessionLog when no active session", async () => {
    const res = await POST(makePostReq(), { params: PARAMS });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("new-session-uuid");
    expect(body.campaignId).toBe(CAMPAIGN_ID);
    expect(body.userId).toBe("user-123");
    expect(body.sessionNumber).toBe(1);
    expect(body.milestone).toBe(false);
    expect(body.events).toEqual([]);
    expect(body.title).toBeUndefined();
    expect(body.summary).toBeUndefined();
  });

  it("calls saveSessionLog and setActiveCampaignSession", async () => {
    await POST(makePostReq(), { params: PARAMS });
    expect(mockedStorage.saveSessionLog).toHaveBeenCalledTimes(1);
    expect(mockedStorage.setActiveCampaignSession).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      "new-session-uuid"
    );
  });

  it("returns 409 when activeSessionId is already set", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({
      campaign: { ...MOCK_CAMPAIGN, activeSessionId: "existing-session-id" } as any,
      role: "dm",
    });
    const res = await POST(makePostReq(), { params: PARAMS });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("A session is already active");
    expect(mockedStorage.saveSessionLog).not.toHaveBeenCalled();
  });

  it("returns 404 when role is not dm", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
    const res = await POST(makePostReq(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it("returns 404 when assertCampaignAccess denies access", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await POST(makePostReq(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  itReturns500WithParams(
    POST,
    makePostReq,
    PARAMS,
    () => mockedStorage.saveSessionLog.mockRejectedValue(new Error("DB error"))
  );
});

// ─── DELETE /api/campaigns/[id]/sessions/active ──────────────────────────────

describe("DELETE /api/campaigns/[id]/sessions/active", () => {
  itReturns401WithParams(DELETE, makeDeleteReq, PARAMS);

  it("returns 200 with sessionId when active session exists", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({
      campaign: { ...MOCK_CAMPAIGN, activeSessionId: "active-session-id" } as any,
      role: "dm",
    });
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(200);
    expect((await res.json()).sessionId).toBe("active-session-id");
    expect(mockedStorage.setActiveCampaignSession).toHaveBeenCalledWith(CAMPAIGN_ID, null);
  });

  it("returns 404 when no active session and force is not set", async () => {
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(404);
    expect(mockedStorage.setActiveCampaignSession).not.toHaveBeenCalled();
  });

  it("returns 200 with null sessionId when force=true and stale session exists", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({
      campaign: { ...MOCK_CAMPAIGN, activeSessionId: "stale-session-id" } as any,
      role: "dm",
    });
    const res = await DELETE(makeDeleteReq(true), { params: PARAMS });
    expect(res.status).toBe(200);
    expect((await res.json()).sessionId).toBe("stale-session-id");
    expect(mockedStorage.setActiveCampaignSession).toHaveBeenCalledWith(CAMPAIGN_ID, null);
  });

  it("returns 200 with null sessionId when force=true and no active session", async () => {
    const res = await DELETE(makeDeleteReq(true), { params: PARAMS });
    expect(res.status).toBe(200);
    expect((await res.json()).sessionId).toBeNull();
    expect(mockedStorage.setActiveCampaignSession).toHaveBeenCalledWith(CAMPAIGN_ID, null);
  });

  it("does not delete SessionLog when closing — only clears activeSessionId", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({
      campaign: { ...MOCK_CAMPAIGN, activeSessionId: "active-session-id" } as any,
      role: "dm",
    });
    await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(mockedStorage.setActiveCampaignSession).toHaveBeenCalledWith(CAMPAIGN_ID, null);
    expect(Object.keys(mockedStorage)).not.toContain("deleteSessionLog");
  });

  it("returns 404 when role is not dm", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN as any, role: "player" });
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it("returns 404 when assertCampaignAccess denies access", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    );
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(404);
  });

  itReturns500WithParams(
    DELETE,
    () => {
      mockedAssertCampaignAccess.mockResolvedValue({
        campaign: { ...MOCK_CAMPAIGN, activeSessionId: "active-session-id" } as any,
        role: "dm",
      });
      return makeDeleteReq();
    },
    PARAMS,
    () => mockedStorage.setActiveCampaignSession.mockRejectedValue(new Error("DB error"))
  );
});
