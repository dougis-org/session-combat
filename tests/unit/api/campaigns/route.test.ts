import { GET, POST } from "@/app/api/campaigns/route";
import { GET as GET_ONE, PATCH, DELETE } from "@/app/api/campaigns/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => {
  const requireAuth = jest.fn();
  return {
    requireAuth,
    withAuth: (handler: (req: any, auth: any) => Promise<any>) =>
      async (request: any) => {
        const auth = requireAuth(request);
        if (auth && typeof auth.json === "function") return auth;
        return handler(request, auth);
      },
    withAuthAndParams: (handler: (req: any, auth: any, params: any) => Promise<any>) =>
      async (request: any, { params }: { params: Promise<any> }) => {
        const resolvedParams = await params;
        const auth = requireAuth(request);
        if (auth && typeof auth.json === "function") return auth;
        return handler(request, auth, resolvedParams);
      },
  };
});

jest.mock("@/lib/storage", () => ({
  storage: {
    loadCampaigns: jest.fn(),
    saveCampaign: jest.fn(),
    loadCampaignById: jest.fn(),
    deleteCampaign: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_CAMPAIGN = {
  id: "campaign-1",
  userId: "user-123",
  name: "Lost Mine of Phandelver",
  moduleName: "LMoP",
  currentChapter: "Goblin Arrows",
  currentChapterOrder: 1,
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const BASE_URL = "http://localhost/api/campaigns";
const makeGetRequest = () => makeRouteRequest(BASE_URL, "GET");
const makePostRequest = (body: unknown) => makeRouteRequest(BASE_URL, "POST", body);
const makeIdRequest = (method: string, body?: unknown) =>
  makeRouteRequest(`${BASE_URL}/campaign-1`, method, body);
const PARAMS = Promise.resolve({ id: "campaign-1" });

// ─── GET /api/campaigns ───────────────────────────────────────────────────────

describe("GET /api/campaigns", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, makeGetRequest, mockedRequireAuth);

  it("returns list of campaigns", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCampaigns.mockResolvedValue([MOCK_CAMPAIGN] as any);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Lost Mine of Phandelver");
  });

  it("returns empty array when no campaigns", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCampaigns.mockResolvedValue([]);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  itReturns500(
    GET,
    makeGetRequest,
    () => mockedStorage.loadCampaigns.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});

// ─── POST /api/campaigns ──────────────────────────────────────────────────────

describe("POST /api/campaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.saveCampaign.mockResolvedValue(undefined as any);
  });

  itReturns401(POST, () => makePostRequest({ name: "Test" }), mockedRequireAuth);

  it("returns 400 when name is missing", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makePostRequest({ moduleName: "X" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is blank", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makePostRequest({ name: "   " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is a non-string type", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makePostRequest({ name: 123 }));
    expect(response.status).toBe(400);
  });

  it("creates campaign with required fields and returns 201", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makePostRequest({ name: "  Dragon Heist  " }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Dragon Heist");
    expect(body.userId).toBe("user-123");
    expect(body.moduleName).toBe("");
    expect(body.currentChapterOrder).toBe(0);
    expect(body.active).toBe(false);
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("creates campaign with all optional fields", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(
      makePostRequest({
        name: "Dragon Heist",
        moduleName: " DH ",
        currentChapter: " Chapter 1 ",
        currentChapterOrder: 1,
        active: true,
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.moduleName).toBe("DH");
    expect(body.currentChapter).toBe("Chapter 1");
    expect(body.currentChapterOrder).toBe(1);
    expect(body.active).toBe(true);
  });

  it("defaults non-finite chapterOrder to 0", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(
      makePostRequest({ name: "Test", currentChapterOrder: NaN })
    );
    expect(response.status).toBe(201);
    expect((await response.json()).currentChapterOrder).toBe(0);
  });

  it("ignores non-string moduleName", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(
      makePostRequest({ name: "Test", moduleName: 42 })
    );
    expect(response.status).toBe(201);
    expect((await response.json()).moduleName).toBe("");
  });

  itReturns500(
    POST,
    () => makePostRequest({ name: "Doomed" }),
    () => mockedStorage.saveCampaign.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});

// ─── GET /api/campaigns/[id] ─────────────────────────────────────────────────

describe("GET /api/campaigns/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(GET_ONE, () => makeIdRequest("GET"), PARAMS, mockedRequireAuth);

  it("returns campaign when found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
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
    mockedRequireAuth
  );

  itReturns500WithParams(
    GET_ONE,
    () => makeIdRequest("GET"),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});

// ─── PATCH /api/campaigns/[id] ───────────────────────────────────────────────

describe("PATCH /api/campaigns/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCampaignById.mockResolvedValue({ ...MOCK_CAMPAIGN } as any);
    mockedStorage.saveCampaign.mockResolvedValue(undefined as any);
  });

  itReturns401WithParams(PATCH, () => makeIdRequest("PATCH", {}), PARAMS, mockedRequireAuth);

  it("updates name and returns 200", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { name: " New Name " }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe("New Name");
  });

  it("updates all optional fields", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", {
        moduleName: " DH2 ",
        currentChapter: " Chapter 2 ",
        currentChapterOrder: 2,
        active: false,
      }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.moduleName).toBe("DH2");
    expect(body.currentChapter).toBe("Chapter 2");
    expect(body.currentChapterOrder).toBe(2);
    expect(body.active).toBe(false);
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

  it("ignores non-finite chapterOrder", async () => {
    const response = await PATCH(
      makeIdRequest("PATCH", { currentChapterOrder: Infinity }),
      { params: PARAMS }
    );
    expect(response.status).toBe(200);
    expect((await response.json()).currentChapterOrder).toBe(MOCK_CAMPAIGN.currentChapterOrder);
  });

  itReturns404WithParams(
    PATCH,
    () => makeIdRequest("PATCH", { name: "X" }),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockResolvedValue(null),
    mockedRequireAuth
  );

  itReturns500WithParams(
    PATCH,
    () => makeIdRequest("PATCH", { name: "X" }),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});

// ─── DELETE /api/campaigns/[id] ──────────────────────────────────────────────

describe("DELETE /api/campaigns/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCampaignById.mockResolvedValue({ ...MOCK_CAMPAIGN } as any);
    mockedStorage.deleteCampaign.mockResolvedValue(undefined as any);
  });

  itReturns401WithParams(DELETE, () => makeIdRequest("DELETE"), PARAMS, mockedRequireAuth);

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
    mockedRequireAuth
  );

  itReturns500WithParams(
    DELETE,
    () => makeIdRequest("DELETE"),
    PARAMS,
    () => mockedStorage.loadCampaignById.mockRejectedValue(new Error("DB error")),
    mockedRequireAuth
  );
});
