/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST, SESSION_BODY_MAX_BYTES } from "@/app/api/campaigns/[id]/sessions/route";
import { storage } from "@/lib/storage";
import type { Campaign } from "@/lib/types";
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
    getNextSessionNumber: jest.fn(),
    saveSessionLog: jest.fn(),
  },
}));

jest.mock("@/lib/utils/campaign", () => ({
  assertCampaignAccess: jest.fn(),
}));

import { assertCampaignAccess } from "@/lib/utils/campaign";

const mockedStorage = jest.mocked(storage);
const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);

const CAMPAIGN_ID = "campaign-1";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/sessions`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const MOCK_CAMPAIGN: Campaign = {
  id: CAMPAIGN_ID,
  userId: "user-123",
  name: "Test Campaign",
  moduleName: "",
  chapters: [],
  partyIds: [],
  status: "active",
  notes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePost(body: unknown) {
  return makeRouteRequest(BASE_URL, "POST", body);
}

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
  mockAuthState.payload = MOCK_AUTH;
  mockedAssertCampaignAccess.mockResolvedValue({ campaign: MOCK_CAMPAIGN, role: "dm" });
  mockedStorage.getNextSessionNumber.mockResolvedValue(3);
  mockedStorage.saveSessionLog.mockResolvedValue(undefined);
});

const VALID_MINIMAL_EVENT_BODY = {
  datePlayed: "2026-09-19",
  events: [{ type: "custom", description: "Party found a secret door" }],
};

describe("POST /api/campaigns/[id]/sessions", () => {
  it("returns 413 when the body exceeds SESSION_BODY_MAX_BYTES, no session log created", async () => {
    const oversized = JSON.stringify({
      datePlayed: "2026-09-19",
      summary: "x".repeat(SESSION_BODY_MAX_BYTES + 1),
    });
    const res = await POST(makeRawPost(oversized, { "content-length": String(Buffer.byteLength(oversized)) }), {
      params: PARAMS,
    });
    expect(res.status).toBe(413);
    expect(mockedStorage.saveSessionLog).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid JSON", async () => {
    const res = await POST(makeRawPost("{not json"), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when datePlayed is missing", async () => {
    const res = await POST(makePost({}), { params: PARAMS });
    expect(res.status).toBe(400);
    expect(mockedStorage.saveSessionLog).not.toHaveBeenCalled();
  });

  it("returns 400 when datePlayed is unparseable", async () => {
    const res = await POST(makePost({ datePlayed: "not-a-date" }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds bound", async () => {
    const res = await POST(
      makePost({ datePlayed: "2026-09-19", title: "x".repeat(201) }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when summary exceeds bound", async () => {
    const res = await POST(
      makePost({ datePlayed: "2026-09-19", summary: "x".repeat(10_001) }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a malformed events element", async () => {
    const res = await POST(
      makePost({ datePlayed: "2026-09-19", events: [{ type: "bogus", description: "x" }] }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an oversized events array", async () => {
    const events = Array.from({ length: 201 }, () => ({ type: "custom", description: "x" }));
    const res = await POST(makePost({ datePlayed: "2026-09-19", events }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 201 for a valid payload with a full-shape combat_completed event", async () => {
    const event = {
      type: "combat_completed",
      description: "Fought a dragon",
      encounterId: "enc-1",
      encounterDescription: "Dragon lair",
      rounds: 5,
      completedAt: "2026-09-19T12:00:00.000Z",
      campaignId: CAMPAIGN_ID,
    };
    const res = await POST(makePost({ datePlayed: "2026-09-19", events: [event] }), { params: PARAMS });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.events[0]).toMatchObject({
      type: "combat_completed",
      description: "Fought a dragon",
      encounterId: "enc-1",
    });
  });

  it("returns 201 for a valid payload with a minimal custom event, no title/summary", async () => {
    const res = await POST(makePost(VALID_MINIMAL_EVENT_BODY), { params: PARAMS });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBeUndefined();
    expect(body.summary).toBeUndefined();
  });

  it("regression: invalid/missing sessionNumber still resolves via getNextSessionNumber fallback", async () => {
    const res = await POST(
      makePost({ ...VALID_MINIMAL_EVENT_BODY, sessionNumber: "not-a-number" }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    expect(mockedStorage.getNextSessionNumber).toHaveBeenCalledWith("user-123", CAMPAIGN_ID);
    const body = await res.json();
    expect(body.sessionNumber).toBe(3);
  });

  it("regression: getNextSessionNumber throwing still returns 503/SESSION_NUMBER_UNAVAILABLE", async () => {
    mockedStorage.getNextSessionNumber.mockRejectedValue(new Error("db down"));
    const res = await POST(makePost(VALID_MINIMAL_EVENT_BODY), { params: PARAMS });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("SESSION_NUMBER_UNAVAILABLE");
  });

  it("regression: milestone/newLevel handling is unaffected", async () => {
    const res = await POST(
      makePost({ ...VALID_MINIMAL_EVENT_BODY, milestone: true, newLevel: 5 }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.milestone).toBe(true);
    expect(body.newLevel).toBe(5);
  });
});
