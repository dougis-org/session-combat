/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/campaigns/[id]/rolls/route";
import { storage } from "@/lib/storage";
import { emitFiltered } from "@/lib/server/transport";
import { MAX_DICE_IN_ROLL, MAX_FORMULA_LENGTH, MAX_LABEL_LENGTH, MAX_TOTAL_MAGNITUDE } from "@/lib/validation/rollSubmission";
import { PERCENTILE_FORMULA, MAX_PER_DIE, DIE_SIDES, MAX_MODIFIER } from "@/lib/utils/dice";
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

/** Build a POST request with a raw (non-JSON.stringify'd) body, for malformed-JSON and size-cap tests. */
function makeRawPost(rawBody: string, extraHeaders?: Record<string, string>) {
  return new NextRequest(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: "auth-token=t",
      ...extraHeaders,
    },
    body: rawBody,
  });
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

  it("returns 400 when body is null", async () => {
    const res = await POST(makePost(null), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("emitFiltered predicate uses canSeeRoll — DM sees dm-only roll", async () => {
    const DM_MEMBER = { ...ACTIVE_PLAYER, role: "dm" as const };
    mockedStorage.listMembersForCampaign.mockResolvedValue([DM_MEMBER]);
    let capturedPredicate: ((uid: string) => boolean) | null = null;
    mockedEmitFiltered.mockImplementation((_cid, _event, predicate) => {
      capturedPredicate = predicate as (uid: string) => boolean;
    });

    await POST(
      makePost({ ...VALID_ROLL_BODY, visibility: { scope: "dm-only" } }),
      { params: PARAMS }
    );
    expect(capturedPredicate).not.toBeNull();
    // DM (same user, role=dm) should see the dm-only roll
    expect(capturedPredicate!(MOCK_AUTH.userId)).toBe(true);
    // unknown user not in members cannot see it
    expect(capturedPredicate!("outsider-id")).toBe(false);
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

  // ─── Slice 3: body-size cap + shared schema validation ────────────────────

  it("T3.1 returns 413 when body exceeds ROLL_BODY_MAX_BYTES, no persist/broadcast", async () => {
    const bigBody = JSON.stringify({ ...VALID_ROLL_BODY, formula: "1d20 " + "x".repeat(20 * 1024) });
    const res = await POST(makeRawPost(bigBody), { params: PARAMS });
    expect(res.status).toBe(413);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.2 returns 413 for an oversized Content-Length header without reading the body", async () => {
    const res = await POST(
      makeRawPost(JSON.stringify(VALID_ROLL_BODY), { "content-length": "999999" }),
      { params: PARAMS }
    );
    expect(res.status).toBe(413);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.3 returns 400 for oversized formula, no persist/broadcast", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, formula: "d".repeat(MAX_FORMULA_LENGTH + 1) }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.4 returns 400 for oversized rolls array, no persist/broadcast", async () => {
    const rolls = Array.from({ length: MAX_DICE_IN_ROLL + 1 }, () => 1);
    const res = await POST(POSTBody(rolls), { params: PARAMS });
    expect(res.status).toBe(400);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();

    function POSTBody(rolls: number[]) {
      return makePost({ ...VALID_ROLL_BODY, rolls, total: rolls.length });
    }
  });

  it("T3.5 returns 400 for an out-of-range die value, no persist/broadcast", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, rolls: [0] }), { params: PARAMS });
    expect(res.status).toBe(400);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.6 returns 400 for an over-magnitude total, no persist/broadcast", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, total: MAX_TOTAL_MAGNITUDE + 1 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.7 returns 400 for a 129-char label, no persist/broadcast", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, label: "x".repeat(MAX_LABEL_LENGTH + 1) }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.9 400 schema-failure body is a single concise error string, not a raw zod dump", async () => {
    const res = await POST(makePost({ ...VALID_ROLL_BODY, formula: "" }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe("string");
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("T3.10 malformed JSON returns 400 Invalid JSON, no persist/broadcast", async () => {
    const res = await POST(makeRawPost("not json {{{"), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON");
    expect(mockedStorage.saveCampaignRoll).not.toHaveBeenCalled();
    expect(mockedEmitFiltered).not.toHaveBeenCalled();
  });

  it("T3.15 d% roll succeeds with 201, persisted and broadcast", async () => {
    const res = await POST(
      makePost({ formula: PERCENTILE_FORMULA, rolls: [87], total: 87, visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    expect(mockedStorage.saveCampaignRoll).toHaveBeenCalledTimes(1);
    expect(mockedEmitFiltered).toHaveBeenCalledTimes(1);
  });

  it("T3.16 maximum legitimate pool (120 dice + 999 modifier) succeeds with 201", async () => {
    const rolls = Array.from({ length: MAX_PER_DIE * DIE_SIDES.length }, () => 20);
    const total = rolls.reduce((a, b) => a + b, 0) + MAX_MODIFIER;
    const res = await POST(
      makePost({ formula: "max pool", rolls, total, visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
  });

  it("T3.17 total that disagrees with sum(rolls) is stored verbatim, 201", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, rolls: [4, 2, 5], total: 999 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.total).toBe(999);
  });

  it("T3.18 empty rolls array, otherwise valid, still returns 201", async () => {
    const res = await POST(
      makePost({ ...VALID_ROLL_BODY, rolls: [], total: 0 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
  });

  it("T3.19 a rejected submission leaves no partial state; a subsequent valid one still succeeds", async () => {
    const rejected = await POST(makePost({ ...VALID_ROLL_BODY, formula: "" }), { params: PARAMS });
    expect(rejected.status).toBe(400);
    expect(mockedEmitFiltered).not.toHaveBeenCalled();

    const accepted = await POST(makePost(VALID_ROLL_BODY), { params: PARAMS });
    expect(accepted.status).toBe(201);
    expect(mockedEmitFiltered).toHaveBeenCalledTimes(1);
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

  it("validates query input before checking membership — missing sessionId short-circuits before getMember", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const res = await GET(makeGet(), { params: PARAMS });
    expect(res.status).toBe(400);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
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
