/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/content/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
} from "@/tests/unit/helpers/route.test.helpers";
import type { SavedContent } from "@/lib/types";

jest.mock("@/lib/middleware");
jest.mock("@/lib/storage", () => ({
  storage: {
    savedContent: {
      list: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedList = jest.mocked(storage.savedContent.list);
const mockedCreate = jest.mocked(storage.savedContent.create);

const CAMPAIGN_ID = "campaign-1";
const BASE_URL = "http://localhost/api/content";

const makeGetReq = (campaignId?: string) =>
  makeRouteRequest(
    campaignId !== undefined ? `${BASE_URL}?campaignId=${campaignId}` : BASE_URL,
    "GET"
  );
const makePostReq = (body: unknown) => makeRouteRequest(BASE_URL, "POST", body);

const VALID_BODY = {
  campaignId: CAMPAIGN_ID,
  type: "npc",
  title: "Grigor the Innkeeper",
  systemPrompt: "You are a DM assistant.",
  userMessage: "Create an innkeeper NPC.",
  prompt: "You are a DM assistant.\n\nCreate an innkeeper NPC.",
};

const MOCK_ITEM: SavedContent = {
  id: "item-1",
  userId: "user-123",
  campaignId: CAMPAIGN_ID,
  type: "npc",
  title: "Grigor the Innkeeper",
  systemPrompt: "You are a DM assistant.",
  userMessage: "Create an innkeeper NPC.",
  prompt: "You are a DM assistant.\n\nCreate an innkeeper NPC.",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAuth.mockReturnValue(MOCK_AUTH);
});

// ─── GET /api/content ─────────────────────────────────────────────────────────

describe("GET /api/content", () => {
  itReturns401(GET, () => makeGetReq(CAMPAIGN_ID), mockedRequireAuth);

  it("returns 400 when campaignId is missing", async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("campaignId is required");
  });

  it("returns 200 with list of items", async () => {
    mockedList.mockResolvedValue([MOCK_ITEM]);
    const res = await GET(makeGetReq(CAMPAIGN_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("item-1");
    expect(mockedList).toHaveBeenCalledWith(CAMPAIGN_ID, "user-123");
  });

  itReturns500(
    GET,
    () => makeGetReq(CAMPAIGN_ID),
    () => mockedList.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});

// ─── POST /api/content ────────────────────────────────────────────────────────

describe("POST /api/content", () => {
  itReturns401(POST, () => makePostReq(VALID_BODY), mockedRequireAuth);

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makePostReq({ campaignId: CAMPAIGN_ID }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when type is invalid", async () => {
    const res = await POST(makePostReq({ ...VALID_BODY, type: "dragon" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid type");
  });

  it("returns 201 with created item", async () => {
    mockedCreate.mockResolvedValue(MOCK_ITEM);
    const res = await POST(makePostReq(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("item-1");
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: CAMPAIGN_ID,
        type: "npc",
        title: "Grigor the Innkeeper",
        userId: "user-123",
      })
    );
  });

  it("accepts all valid type values", async () => {
    const types = ["npc", "location", "shop", "magic-item", "room"] as const;
    for (const type of types) {
      mockedCreate.mockResolvedValue({ ...MOCK_ITEM, type });
      const res = await POST(makePostReq({ ...VALID_BODY, type }));
      expect(res.status).toBe(201);
    }
  });

  it("includes optional chapter when provided", async () => {
    mockedCreate.mockResolvedValue({ ...MOCK_ITEM, chapter: "Chapter 1" });
    const res = await POST(makePostReq({ ...VALID_BODY, chapter: "Chapter 1" }));
    expect(res.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ chapter: "Chapter 1" })
    );
  });

  itReturns500(
    POST,
    () => makePostReq(VALID_BODY),
    () => mockedCreate.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});
