/**
 * @jest-environment node
 */
import { POST } from "@/app/api/campaigns/global/[id]/copy/route";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage", () => ({
  storage: {
    loadGlobalCampaignTemplateById: jest.fn(),
    saveCampaign: jest.fn(),
    addMember: jest.fn(),
    deleteCampaign: jest.fn(),
  },
}));

let uuidCounter = 0;
jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => `uuid-${++uuidCounter}`),
}));

const mockedStorage = jest.mocked(storage);

const TEMPLATE_ID = "tpl-1";
const BASE_URL = `http://localhost/api/campaigns/global/${TEMPLATE_ID}/copy`;
const PARAMS = Promise.resolve({ id: TEMPLATE_ID });

const MOCK_TEMPLATE = {
  id: TEMPLATE_ID,
  userId: "GLOBAL",
  isGlobal: true,
  name: "Lost Mine of Phandelver",
  moduleName: "LMoP",
  chapters: [
    { id: "orig-ch-1", title: "Chapter 1", order: 0 },
    { id: "orig-ch-2", title: "Chapter 2", order: 1 },
  ],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  uuidCounter = 0;
  mockAuthState.payload = MOCK_AUTH;
  mockedStorage.saveCampaign.mockResolvedValue(undefined as any);
  mockedStorage.addMember.mockResolvedValue(undefined as any);
  mockedStorage.deleteCampaign.mockResolvedValue(undefined as any);
});

describe("POST /api/campaigns/global/[id]/copy — auth", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthState.payload = null;
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/campaigns/global/[id]/copy — not found", () => {
  it("returns 404 when template does not exist", async () => {
    mockedStorage.loadGlobalCampaignTemplateById.mockResolvedValue(null as any);
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not found/i);
  });
});

describe("POST /api/campaigns/global/[id]/copy — success", () => {
  beforeEach(() => {
    mockedStorage.loadGlobalCampaignTemplateById.mockResolvedValue(MOCK_TEMPLATE as any);
  });

  it("returns 201 with the new campaign", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(201);
  });

  it("assigns the authenticated user's userId", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect((await res.json()).userId).toBe(MOCK_AUTH.userId);
  });

  it("copies name and moduleName from template", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    const data = await res.json();
    expect(data.name).toBe("Lost Mine of Phandelver");
    expect(data.moduleName).toBe("LMoP");
  });

  it("gives chapters new UUIDs — not the originals", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    const data = await res.json();
    expect(data.chapters).toHaveLength(2);
    const ids = data.chapters.map((ch: { id: string }) => ch.id);
    expect(ids).not.toContain("orig-ch-1");
    expect(ids).not.toContain("orig-ch-2");
    expect(new Set(ids).size).toBe(2);
  });

  it("sets currentChapterId to the first copied chapter", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    const data = await res.json();
    expect(data.currentChapterId).toBe(data.chapters[0].id);
  });

  it("sets templateId to the source template id", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect((await res.json()).templateId).toBe(TEMPLATE_ID);
  });

  it("creates campaign with status planning", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    const data = await res.json();
    expect(data.status).toBe("planning");
    expect(data).not.toHaveProperty("active");
  });

  it("handles empty chapters — currentChapterId is absent", async () => {
    mockedStorage.loadGlobalCampaignTemplateById.mockResolvedValue({
      ...MOCK_TEMPLATE,
      chapters: [],
    } as any);
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.chapters).toEqual([]);
    expect(data.currentChapterId).toBeUndefined();
  });
});

describe("POST /api/campaigns/global/[id]/copy — error handling", () => {
  it("returns 500 when loadGlobalCampaignTemplateById throws", async () => {
    mockedStorage.loadGlobalCampaignTemplateById.mockRejectedValue(new Error("DB error"));
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(500);
  });

  it("returns 500 when saveCampaign throws", async () => {
    mockedStorage.loadGlobalCampaignTemplateById.mockResolvedValue(MOCK_TEMPLATE as any);
    mockedStorage.saveCampaign.mockRejectedValue(new Error("write failed"));
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(500);
  });

  it("returns 500 and calls deleteCampaign when addMember throws", async () => {
    mockedStorage.loadGlobalCampaignTemplateById.mockResolvedValue(MOCK_TEMPLATE as any);
    mockedStorage.addMember.mockRejectedValue(new Error("member insert failed"));
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(500);
    expect(mockedStorage.deleteCampaign).toHaveBeenCalledTimes(1);
  });

  it("does not call deleteCampaign when saveCampaign fails", async () => {
    mockedStorage.loadGlobalCampaignTemplateById.mockResolvedValue(MOCK_TEMPLATE as any);
    mockedStorage.saveCampaign.mockRejectedValue(new Error("write failed"));
    const res = await POST(makeRouteRequest(BASE_URL, "POST"), { params: PARAMS });
    expect(res.status).toBe(500);
    expect(mockedStorage.deleteCampaign).not.toHaveBeenCalled();
  });
});
