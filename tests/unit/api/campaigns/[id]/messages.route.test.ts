/**
 * @jest-environment node
 */
import { POST } from "@/app/api/campaigns/[id]/messages/route";
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

const CAMPAIGN_ID = "campaign-xyz";
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/messages`;
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const DM_MEMBER = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "dm" as const,
  status: "active" as const,
  history: [],
};

const PLAYER_MEMBER = { ...DM_MEMBER, role: "player" as const };

function makePost(body: unknown) {
  return makeRouteRequest(BASE_URL, "POST", body);
}

function makeMockInsertOne() {
  return jest.fn().mockResolvedValue({ insertedId: "mock-id" });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetDatabase = jest.fn();
  const dbModule = require("@/lib/db");
  dbModule.getDatabase.mockImplementation((...args: unknown[]) =>
    mockedGetDatabase(...args)
  );
  mockedStorage.getUserById.mockResolvedValue({
    id: MOCK_AUTH.userId,
    username: "testuser",
  });
  mockedStorage.listMembersForCampaign.mockResolvedValue([DM_MEMBER]);
  mockedEmitFiltered.mockReturnValue(undefined);
  mockAuthState.payload = MOCK_AUTH;
});

describe("POST /messages — scene kind", () => {
  it("T1-1: DM POSTs scene with image + caption → 201 with kind, attachmentId, text", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ kind: "scene", attachmentId: "abc", text: "Caption", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.kind).toBe("scene");
    expect(body.attachmentId).toBe("abc");
    expect(body.text).toBe("Caption");
  });

  it("T1-2: DM POSTs scene with image only (no text) → 201", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ kind: "scene", attachmentId: "abc", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.kind).toBe("scene");
    expect(body.attachmentId).toBe("abc");
  });

  it("T1-3: DM POSTs scene with caption only (no attachmentId) → 201", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ kind: "scene", text: "Caption only", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.kind).toBe("scene");
    expect(body.text).toBe("Caption only");
    expect(body.attachmentId).toBeUndefined();
  });

  it("T1-4: DM POSTs scene with neither text nor attachmentId → 400", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);

    const res = await POST(
      makePost({ kind: "scene", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("T1-5: Non-DM member POSTs kind:'scene' → 403", async () => {
    mockedStorage.getMember.mockResolvedValue(PLAYER_MEMBER);

    const res = await POST(
      makePost({ kind: "scene", text: "Sneaky", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(403);
  });

  it("T1-6: POST with no kind and empty text → 400 (unchanged)", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ text: "", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("T1-7: POST with no kind and valid text → 201; kind absent in response", async () => {
    mockedStorage.getMember.mockResolvedValue(PLAYER_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    const res = await POST(
      makePost({ text: "Hello", visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.kind).toBeUndefined();
  });

  it("T1-8b: DM POSTs scene with caption > 5000 chars → 400", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);

    const res = await POST(
      makePost({ kind: "scene", text: "x".repeat(5001), visibility: { scope: "group" } }),
      { params: PARAMS }
    );
    expect(res.status).toBe(400);
  });

  it("T1-8: Scene POST calls emitFiltered with kind:'scene' in data", async () => {
    mockedStorage.getMember.mockResolvedValue(DM_MEMBER);
    mockDbCollection(mockedGetDatabase, { insertOne: makeMockInsertOne() });

    await POST(
      makePost({ kind: "scene", attachmentId: "abc", text: "Test", visibility: { scope: "group" } }),
      { params: PARAMS }
    );

    expect(mockedEmitFiltered).toHaveBeenCalledTimes(1);
    const [, event] = mockedEmitFiltered.mock.calls[0];
    expect((event as { data: { kind: string } }).data.kind).toBe("scene");
  });
});
