/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/campaigns/route";
import { GET as GET_ONE, PATCH, DELETE } from "@/app/api/campaigns/[id]/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itReturns500,
  itReturns404WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) => (req: NextRequest) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }),
  withAuthAndParams: (handler: Function) => async (req: NextRequest, ctx: any) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }, await ctx.params),
}));

jest.mock("@/lib/storage", () => ({
  storage: {
    loadCampaigns: jest.fn(),
    saveCampaign: jest.fn(),
    loadCampaignById: jest.fn(),
    deleteCampaign: jest.fn(),
    addMember: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockedStorage = jest.mocked(storage);

const MOCK_CAMPAIGN = {
  id: "campaign-1",
  userId: "user-123",
  name: "Lost Mine of Phandelver",
  moduleName: "LMoP",
  chapters: [],
  status: "active",
  notes: "",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const BASE_URL = "http://localhost/api/campaigns";
const makeGetRequest = () => makeRouteRequest(BASE_URL, "GET");
const makePostRequest = (body: unknown) => makeRouteRequest(BASE_URL, "POST", body);
const makeIdRequest = (method: string, body?: unknown) =>
  makeRouteRequest(`${BASE_URL}/campaign-1`, method, body);
const PARAMS = Promise.resolve({ id: "campaign-1" });
const PATCH_SINGLE_CHAPTER = [{ id: "ch-5", title: "New Chapter 5", order: 0 }];

// ─── GET /api/campaigns ───────────────────────────────────────────────────────

describe("GET /api/campaigns", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns list of campaigns", async () => {
    mockedStorage.loadCampaigns.mockResolvedValue([MOCK_CAMPAIGN] as any);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Lost Mine of Phandelver");
  });

  it("returns empty array when no campaigns", async () => {
    mockedStorage.loadCampaigns.mockResolvedValue([]);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  itReturns500(
    GET,
    makeGetRequest,
    () => mockedStorage.loadCampaigns.mockRejectedValue(new Error("DB error")),
  );
});

// ─── POST /api/campaigns ──────────────────────────────────────────────────────

describe("POST /api/campaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.saveCampaign.mockResolvedValue(undefined as any);
  });

  it("returns 400 when name is missing", async () => {
    const response = await POST(makePostRequest({ moduleName: "X" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is blank", async () => {
    const response = await POST(makePostRequest({ name: "   " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is a non-string type", async () => {
    const response = await POST(makePostRequest({ name: 123 }));
    expect(response.status).toBe(400);
  });

  it("creates campaign with required fields and returns 201", async () => {
    const response = await POST(makePostRequest({ name: "  Dragon Heist  " }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Dragon Heist");
    expect(body.userId).toBe("user-123");
    expect(body.moduleName).toBe("");
    expect(body.chapters).toEqual([]);
    expect(body.status).toBe("active");
    expect(body.notes).toBe("");
    expect(body).not.toHaveProperty("active");
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("creates campaign with optional moduleName and explicit status", async () => {
    const response = await POST(
      makePostRequest({
        name: "Dragon Heist",
        moduleName: " DH ",
        status: "planning",
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.moduleName).toBe("DH");
    expect(body.status).toBe("planning");
    expect(body).not.toHaveProperty("active");
  });

  it("POST with no status defaults to active", async () => {
    const response = await POST(makePostRequest({ name: "Test" }));
    expect(response.status).toBe(201);
    expect((await response.json()).status).toBe("active");
  });

  it("POST with no notes defaults to empty string", async () => {
    const response = await POST(makePostRequest({ name: "Test" }));
    expect((await response.json()).notes).toBe("");
  });

  it("POST returns 400 when notes exceed 10000 chars", async () => {
    const response = await POST(makePostRequest({ name: "Test", notes: "x".repeat(10001) }));
    expect(response.status).toBe(400);
  });

  it("POST returns 201 when notes are exactly 10000 chars", async () => {
    const response = await POST(makePostRequest({ name: "Test", notes: "x".repeat(10000) }));
    expect(response.status).toBe(201);
  });

  it("ignores non-string moduleName", async () => {
    const response = await POST(
      makePostRequest({ name: "Test", moduleName: 42 })
    );
    expect(response.status).toBe(201);
    expect((await response.json()).moduleName).toBe("");
  });

  it("creates campaign with chapters and valid currentChapterId", async () => {
    const response = await POST(
      makePostRequest({
        name: "Lost Mine",
        chapters: [
          { id: "ch-1", title: "Chapter 1", order: 1 },
          { id: "ch-2", title: "Chapter 2", order: 0 },
        ],
        currentChapterId: "ch-2",
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.chapters).toEqual([
      { id: "ch-2", title: "Chapter 2", order: 0 },
      { id: "ch-1", title: "Chapter 1", order: 1 },
    ]);
    expect(body.currentChapterId).toBe("ch-2");
  });

  it("clears currentChapterId if it does not exist in chapters", async () => {
    const response = await POST(
      makePostRequest({
        name: "Lost Mine",
        chapters: [
          { id: "ch-1", title: "Chapter 1", order: 0 },
        ],
        currentChapterId: "nonexistent-id",
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.currentChapterId).toBeUndefined();
  });

  itReturns500(
    POST,
    () => makePostRequest({ name: "Doomed" }),
    () => mockedStorage.saveCampaign.mockRejectedValue(new Error("DB error")),
  );
});

// ─── GET /api/campaigns/[id] ─────────────────────────────────────────────────

describe("GET /api/campaigns/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns campaign when found", async () => {
    mockedStorage.loadCampaignById.mockResolvedValue(MOCK_CAMPAIGN as any);

    const response = await GET_ONE(makeIdRequest("GET"), { params: PARAMS });
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe("Lost Mine of Phandelver");
  });

  itReturns404WithParams(
    GET_ONE,
    () => makeIdRequest("GET"),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockResolvedValue(null),
  );

  itReturns500WithParams(
    GET_ONE,
    () => makeIdRequest("GET"),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockRejectedValue(new Error("DB error")),
  );
});

// ─── PATCH /api/campaigns/[id] ───────────────────────────────────────────────

describe("PATCH /api/campaigns/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.loadCampaignById.mockResolvedValue({ ...MOCK_CAMPAIGN } as any);
    mockedStorage.saveCampaign.mockResolvedValue(undefined as any);
  });

  it("updates name and returns 200", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { name: " New Name " }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe("New Name");
  });

  it("updates moduleName and status fields", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", {
        moduleName: " DH2 ",
        status: "completed",
      }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.moduleName).toBe("DH2");
    expect(body.status).toBe("completed");
    expect(body).not.toHaveProperty("active");
  });

  it("returns 400 when status is invalid", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { status: "running" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when status is empty string", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { status: "" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 when status is on-hold", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { status: "on-hold" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("on-hold");
  });

  it("returns 400 when notes exceed 10000 chars", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { notes: "x".repeat(10001) }),
      { params: PARAMS }
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 when notes are exactly 10000 chars", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { notes: "x".repeat(10000) }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect((await response.json()).notes).toHaveLength(10000);
  });

  it("PATCH response does not include active field", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { name: "Updated" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("active");
  });

  it("treats missing status field on stored document as active (backwards compat)", async () => {
    mockedStorage.loadCampaignById.mockResolvedValue({ ...MOCK_CAMPAIGN, status: undefined } as any);
    const response = await PATCH(
      makeIdRequest("PATCH", { name: "Test" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("active");
  });

  it("strips legacy active field from stored document in PATCH response", async () => {
    mockedStorage.loadCampaignById.mockResolvedValue({ ...MOCK_CAMPAIGN, active: true } as any);
    const response = await PATCH(
      makeIdRequest("PATCH", { name: "Test" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("active");
  });

  it("returns 400 when name is blank", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { name: "   " }),
      { params: PARAMS }
    );
    expect(response.status).toBe(400);
  });

  it("ignores non-string moduleName", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { moduleName: 99 }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.moduleName).toBe(MOCK_CAMPAIGN.moduleName);
  });


  it("returns 400 when chapters is not an array on PATCH", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { chapters: "not-an-array" }),
      { params: PARAMS }
    );
    expect(response.status).toBe(400);
  });

  it("updates chapters and currentChapterId on PATCH", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", {
        chapters: PATCH_SINGLE_CHAPTER,
        currentChapterId: "ch-5",
      }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.chapters).toEqual([
      { id: "ch-5", title: "New Chapter 5", order: 0 },
    ]);
    expect(body.currentChapterId).toBe("ch-5");
  });

  it("clears currentChapterId on PATCH if it is invalid", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", {
        chapters: PATCH_SINGLE_CHAPTER,
        currentChapterId: "invalid-id",
      }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.currentChapterId).toBeUndefined();
  });

  itReturns404WithParams(
    PATCH,
    () => makeIdRequest("PATCH", { name: "X" }),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockResolvedValue(null),
  );

  itReturns500WithParams(
    PATCH,
    () => makeIdRequest("PATCH", { name: "X" }),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockRejectedValue(new Error("DB error")),
  );
});

// ─── DELETE /api/campaigns/[id] ──────────────────────────────────────────────

describe("DELETE /api/campaigns/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.loadCampaignById.mockResolvedValue({ ...MOCK_CAMPAIGN } as any);
    mockedStorage.deleteCampaign.mockResolvedValue(undefined as any);
  });

  it("deletes campaign and returns 200", async () => {
    const response = await DELETE(makeIdRequest("DELETE"), { params: PARAMS });
    expect(response.status).toBe(200);
    expect(mockedStorage.deleteCampaign).toHaveBeenCalledWith("campaign-1", "user-123");
  });

  itReturns404WithParams(
    DELETE,
    () => makeIdRequest("DELETE"),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockResolvedValue(null),
  );

  itReturns500WithParams(
    DELETE,
    () => makeIdRequest("DELETE"),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockRejectedValue(new Error("DB error")),
  );
});
