/**
 * @jest-environment node
 */
import { POST, GET } from "@/app/api/campaigns/[id]/messages/route";
import { storage } from "@/lib/storage";
import { emitFiltered } from "@/lib/server/transport";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
  mockDbCollection,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    getUserById: jest.fn(),
    listMembersForCampaign: jest.fn(),
  },
}));

let mockedGetDatabase: jest.Mock;
jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn((...args: unknown[]) => mockedGetDatabase(...args)),
}));

jest.mock("@/lib/server/transport", () => ({
  emitFiltered: jest.fn(),
}));

const mockedStorage = jest.mocked(storage);
const mockedEmitFiltered = jest.mocked(emitFiltered);

const CAMPAIGN_ID = "campaign-abc";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/messages`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const ACTIVE_MEMBER = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player" as const,
  status: "active" as const,
  history: [],
};

const DM_MEMBER = { ...ACTIVE_MEMBER, role: "dm" as const };

function makePost(body: unknown) {
  return makeRouteRequest(BASE_URL, "POST", body);
}

function makeGet(qs = "") {
  return makeRouteRequest(`${BASE_URL}${qs}`, "GET");
}

function makeMockInsertOne() {
  return jest.fn().mockResolvedValue({ insertedId: "mock-id" });
}

function makeMockFind(docs: unknown[]) {
  return jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(docs),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetDatabase = jest.fn();
  // Reassign so the mock module closure gets the fresh reference
  const dbModule = require("@/lib/db");
  dbModule.getDatabase.mockImplementation((...args: unknown[]) =>
    mockedGetDatabase(...args)
  );

  mockedStorage.getUserById.mockResolvedValue({
    id: MOCK_AUTH.userId,
    username: "testuser",
  });
  mockedStorage.listMembersForCampaign.mockResolvedValue([ACTIVE_MEMBER]);
  mockedEmitFiltered.mockReturnValue(undefined);
});

// ─── POST tests ──────────────────────────────────────────────────────────────

describe("POST /api/campaigns/[id]/messages", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuthState.payload = null;
    const res = await POST(makePost({ text: "hi", visibility: { scope: "group" } }), {
      params: PARAMS,
    });
    expect(res.status).toBe(401);
    mockAuthState.payload = MOCK_AUTH;
  });

  it("returns 403 when caller is not an active member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const res = await POST(makePost({ text: "hi", visibility: { scope: "group" } }), {
      params: PARAMS,
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller status is invited", async () => {
    mockedStorage.getMember.mockResolvedValue({ ...ACTIVE_MEMBER, status: "invited" });
    const res = await POST(makePost({ text: "hi", visibility: { scope: "group" } }), {
      params: PARAMS,
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when text is missing", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });
    const res = await POST(makePost({ visibility: { scope: "group" } }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when text is empty string", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });
    const res = await POST(makePost({ text: "   ", visibility: { scope: "group" } }), {
      params: PARAMS,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when text exceeds 5000 characters", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });
    const res = await POST(
      makePost({ text: "x".repeat(5001), visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when visibility is missing", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });
    const res = await POST(makePost({ text: "hi" }), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when scope is invalid", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });
    const res = await POST(
      makePost({ text: "hi", visibility: { scope: "broadcast" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when direct message is missing toUserId", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });
    const res = await POST(
      makePost({ text: "hi", visibility: { scope: "direct" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("returns 201 with group message and calls emitFiltered", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ text: "Hello world", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.text).toBe("Hello world");
    expect(body.visibility).toEqual({ scope: "group" });
    expect(body.senderId).toBe(MOCK_AUTH.userId);
    expect(body.senderName).toBe("testuser");
    expect(mockedEmitFiltered).toHaveBeenCalledTimes(1);
  });

  it("returns 201 with direct message", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ text: "Whisper", visibility: { scope: "direct", toUserId: "user-b" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.visibility).toEqual({ scope: "direct", toUserId: "user-b" });
  });

  it("returns 201 with dm-only message", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ text: "DM note", visibility: { scope: "dm-only" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
  });

  it("falls back to Unknown senderName when user not found", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockedStorage.getUserById.mockResolvedValue(null);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ text: "hi", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.senderName).toBe("Unknown");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    const req = new (require("next/server").NextRequest)(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
      body: "not-json",
    });
    const res = await POST(req, { params: PARAMS });
    expect(res.status).toBe(400);
  });
});

// ─── GET tests ───────────────────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/messages", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuthState.payload = null;
    const res = await GET(makeGet(), { params: PARAMS });
    expect(res.status).toBe(401);
    mockAuthState.payload = MOCK_AUTH;
  });

  it("returns 403 when caller is not an active member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const res = await GET(makeGet(), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid before cursor", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    const res = await GET(makeGet("?before=not-a-date"), { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("returns 200 with empty messages when none exist", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    mockDbCollection(mockedGetDatabase, { find: makeMockFind([]) });

    const res = await GET(makeGet(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toEqual([]);
    expect(body.nextCursor).toBeUndefined();
  });

  it("returns group messages for player role", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    const docs = [
      { id: "msg-1", campaignId: CAMPAIGN_ID, text: "Hello", visibility: { scope: "group" }, createdAt: new Date() },
    ];
    mockDbCollection(mockedGetDatabase, { find: makeMockFind(docs) });

    const res = await GET(makeGet(), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].text).toBe("Hello");
  });

  it("returns nextCursor when results exceed limit", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    // 51 docs returned when limit is 50
    const docs = Array.from({ length: 51 }, (_, i) => ({
      id: `msg-${i}`,
      text: `Msg ${i}`,
      createdAt: new Date(Date.now() - i * 1000),
      visibility: { scope: "group" },
    }));
    mockDbCollection(mockedGetDatabase, { find: makeMockFind(docs) });

    const res = await GET(makeGet("?limit=50"), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toHaveLength(50);
    expect(body.nextCursor).toBeDefined();
  });

  it("caps limit at 100", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    const findMock = makeMockFind([]);
    const limitMock = jest.fn().mockReturnThis();
    mockDbCollection(mockedGetDatabase, {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: limitMock,
        toArray: jest.fn().mockResolvedValue([]),
      }),
    });

    await GET(makeGet("?limit=200"), { params: PARAMS });
    // limit called with 101 (100 + 1 for next-page detection)
    expect(limitMock).toHaveBeenCalledWith(101);
    void findMock;
  });

  it("uses DM query (includes dm-only scope) for DM role", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    const findMock = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    });
    mockDbCollection(mockedGetDatabase, { find: findMock });

    await GET(makeGet(), { params: PARAMS });

    const query = findMock.mock.calls[0][0] as Record<string, unknown>;
    const orClauses = query.$or as Array<Record<string, unknown>>;
    // DM query should include a catch-all for dm-only scope
    expect(orClauses.some(c => c['visibility.scope'] === 'dm-only' && !c['senderId'])).toBe(true);
  });

  it("applies before cursor to query when provided", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_MEMBER);
    const findMock = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    });
    mockDbCollection(mockedGetDatabase, { find: findMock });

    const cursor = new Date().toISOString();
    await GET(makeGet(`?before=${encodeURIComponent(cursor)}`), { params: PARAMS });

    const query = findMock.mock.calls[0][0] as Record<string, unknown>;
    expect(query.createdAt).toBeDefined();
  });
});
