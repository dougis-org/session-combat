/**
 * @jest-environment node
 */
import { POST, GET } from "@/app/api/campaigns/[id]/rolls/route";
import { storage } from "@/lib/storage";
import { emitFiltered } from "@/lib/server/transport";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    getUserById: jest.fn(),
    listMembersForCampaign: jest.fn(),
    listCampaignRolls: jest.fn(),
    saveCampaignRoll: jest.fn(),
  },
}));

jest.mock("@/lib/server/transport", () => ({
  emitFiltered: jest.fn(),
}));

jest.mock("@/lib/utils/campaign", () => ({
  assertCampaignAccess: jest.fn(),
}));

import { assertCampaignAccess } from "@/lib/utils/campaign";

const mockedStorage = jest.mocked(storage);
const mockedEmitFiltered = jest.mocked(emitFiltered);
const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);

const CAMPAIGN_ID = "campaign-abc";
const SESSION_ID = "session-xyz";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/rolls`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const ACTIVE_PLAYER = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player" as const,
  status: "active" as const,
  history: [],
};

const ACTIVE_DM = { ...ACTIVE_PLAYER, role: "dm" as const };

const VALID_ROLL_BODY = {
  formula: "1d20",
  rolls: [15],
  total: 15,
  visibility: { scope: "group" },
};

function makePost(body: unknown) {
  return makeRouteRequest(BASE_URL, "POST", body);
}

function makeGet(qs = "") {
  return makeRouteRequest(`${BASE_URL}${qs}`, "GET");
}

beforeEach(() => {
  jest.clearAllMocks();

  mockedAssertCampaignAccess.mockResolvedValue({
    campaign: { id: CAMPAIGN_ID, activeSessionId: SESSION_ID } as any,
    role: "player",
  });
  mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
  mockedStorage.getUserById.mockResolvedValue({
    id: MOCK_AUTH.userId,
    username: "testuser",
  });
  mockedStorage.listMembersForCampaign.mockResolvedValue([ACTIVE_PLAYER]);
  mockedStorage.saveCampaignRoll.mockResolvedValue(undefined);
  mockedEmitFiltered.mockReturnValue(undefined);
});

// ─── POST tests ───────────────────────────────────────────────────────────────

describe("POST /api/campaigns/[id]/rolls", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuthState.payload = null;
    const res = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(res.status).toBe(401);
    mockAuthState.payload = MOCK_AUTH;
  });

  it("returns 403 when caller is not an active member (null)", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const res = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller status is pending", async () => {
    mockedStorage.getMember.mockResolvedValue({ ...ACTIVE_PLAYER, status: "pending" as any });
    const res = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it("returns 409 when no active session", async () => {
    mockedAssertCampaignAccess.mockResolvedValue({
      campaign: { id: CAMPAIGN_ID, activeSessionId: undefined } as any,
      role: "player",
    });
    const res = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("No active session");
  });

  it("returns 400 when formula is missing", async () => {
    const { formula: _, ...body } = VALID_ROLL_BODY;
    const res = await POST(makePost(body), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when formula is empty string", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, formula: "" }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when rolls is missing", async () => {
    const { rolls: _, ...body } = VALID_ROLL_BODY;
    const res = await POST(makePost(body), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when rolls is not an array", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, rolls: "foo" }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when rolls contains non-numbers", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, rolls: ["a", null] }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when total is missing", async () => {
    const { total: _, ...body } = VALID_ROLL_BODY;
    const res = await POST(makePost(body), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when total is not a number", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, total: "big" }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when total is NaN", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, total: NaN }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when visibility is missing", async () => {
    const { visibility: _, ...body } = VALID_ROLL_BODY;
    const res = await POST(makePost(body), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when visibility.scope is invalid (direct)", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, visibility: { scope: "direct", toUserId: "x" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 201 with valid group roll and calls emitFiltered", async () => {
    const res = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.campaignId).toBe(CAMPAIGN_ID);
    expect(body.sessionId).toBe(SESSION_ID);
    expect(body.rollerId).toBe(MOCK_AUTH.userId);
    expect(body.rollerName).toBe("testuser");
    expect(body.formula).toBe("1d20");
    expect(body.rolls).toEqual([15]);
    expect(body.total).toBe(15);
    expect(body.visibility).toEqual({ scope: "group" });
    expect(mockedEmitFiltered).toHaveBeenCalledTimes(1);
    expect(mockedEmitFiltered).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      expect.objectContaining({ type: "roll", campaignId: CAMPAIGN_ID }),
      expect.any(Function)
    );
  });

  it("returns 201 with valid dm-only roll", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, visibility: { scope: "dm-only" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.visibility).toEqual({ scope: "dm-only" });
  });

  it("saves roll with correct sessionId via storage.saveCampaignRoll", async () => {
    await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(mockedStorage.saveCampaignRoll).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: SESSION_ID })
    );
  });

  it("returns 500 when saveCampaignRoll throws", async () => {
    mockedStorage.saveCampaignRoll.mockRejectedValue(new Error("DB down"));
    const res = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});

// ─── GET tests ────────────────────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/rolls", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuthState.payload = null;
    const res = await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(res.status).toBe(401);
    mockAuthState.payload = MOCK_AUTH;
  });

  it("returns 403 when caller is not an active member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const res = await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is inactive", async () => {
    mockedStorage.getMember.mockResolvedValue({ ...ACTIVE_PLAYER, status: "pending" as any });
    const res = await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it("returns 400 when sessionId is missing", async () => {
    const res = await GET(makeGet(), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when sessionId is empty", async () => {
    const res = await GET(makeGet("?sessionId="), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 200 with rolls from listCampaignRolls", async () => {
    const mockRolls = [
      { id: "r1", formula: "1d20", rolls: [15], total: 15, visibility: { scope: "group" } },
    ];
    mockedStorage.listCampaignRolls.mockResolvedValue({ rolls: mockRolls as any });
    const res = await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rolls).toHaveLength(1);
    expect(body.nextCursor).toBeUndefined();
  });

  it("returns nextCursor when present in listCampaignRolls result", async () => {
    mockedStorage.listCampaignRolls.mockResolvedValue({
      rolls: [],
      nextCursor: "2026-01-01T00:00:00.000Z",
    });
    const res = await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nextCursor).toBe("2026-01-01T00:00:00.000Z");
  });

  it("passes limit and before to listCampaignRolls", async () => {
    mockedStorage.listCampaignRolls.mockResolvedValue({ rolls: [] });
    const before = "2026-01-01T00:00:00.000Z";
    await GET(makeGet(`?sessionId=${SESSION_ID}&limit=10&before=${encodeURIComponent(before)}`), {
      params: PARAMS,
    });
    expect(mockedStorage.listCampaignRolls).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      SESSION_ID,
      MOCK_AUTH.userId,
      "player",
      expect.objectContaining({ limit: 10, before: expect.any(Date) })
    );
  });

  it("caps limit at 100", async () => {
    mockedStorage.listCampaignRolls.mockResolvedValue({ rolls: [] });
    await GET(makeGet(`?sessionId=${SESSION_ID}&limit=200`), { params: PARAMS });
    expect(mockedStorage.listCampaignRolls).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      SESSION_ID,
      MOCK_AUTH.userId,
      "player",
      expect.objectContaining({ limit: 100 })
    );
  });

  it("passes dm role when caller is DM", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedStorage.listCampaignRolls.mockResolvedValue({ rolls: [] });
    await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(mockedStorage.listCampaignRolls).toHaveBeenCalledWith(
      CAMPAIGN_ID,
      SESSION_ID,
      MOCK_AUTH.userId,
      "dm",
      expect.any(Object)
    );
  });

  it("returns 500 when listCampaignRolls throws", async () => {
    mockedStorage.listCampaignRolls.mockRejectedValue(new Error("DB error"));
    const res = await GET(makeGet(`?sessionId=${SESSION_ID}`), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});
