import { GET, POST, PUT } from "@/app/api/campaigns/global/route";
import { requireAdmin } from "@/lib/api-helpers";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  mockAdminDenied,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/api-helpers", () => ({ requireAdmin: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadGlobalCampaignTemplates: jest.fn(),
    saveCampaignTemplate: jest.fn(),
  },
}));
jest.mock("crypto", () => ({ randomUUID: jest.fn(() => "test-uuid") }));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedStorage = jest.mocked(storage);

const BASE_URL = "http://localhost/api/campaigns/global";

const MOCK_TEMPLATE = {
  id: "tpl-1",
  userId: "GLOBAL",
  isGlobal: true,
  name: "Lost Mine of Phandelver",
  moduleName: "LMoP",
  chapters: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue(null);
});

// ─── GET /api/campaigns/global ────────────────────────────────────────────────

describe("GET /api/campaigns/global", () => {
  it("returns 200 with templates array", async () => {
    mockedStorage.loadGlobalCampaignTemplates.mockResolvedValue([MOCK_TEMPLATE] as any);
    const res = await GET(makeRouteRequest(BASE_URL, "GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Lost Mine of Phandelver");
  });

  it("returns empty array when no templates exist", async () => {
    mockedStorage.loadGlobalCampaignTemplates.mockResolvedValue([]);
    const res = await GET(makeRouteRequest(BASE_URL, "GET"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 500 when storage throws", async () => {
    mockedStorage.loadGlobalCampaignTemplates.mockRejectedValue(new Error("DB error"));
    const res = await GET(makeRouteRequest(BASE_URL, "GET"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/failed/i);
  });
});

// ─── POST /api/campaigns/global — auth ────────────────────────────────────────

describe("POST /api/campaigns/global — auth", () => {
  it("returns 401 when not authenticated", async () => {
    mockAdminDenied(mockedRequireAdmin as jest.Mock, 401);
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when not admin", async () => {
    mockAdminDenied(mockedRequireAdmin as jest.Mock, 403);
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { name: "Test" }));
    expect(res.status).toBe(403);
  });
});

// ─── POST /api/campaigns/global — validation ──────────────────────────────────

describe("POST /api/campaigns/global — validation", () => {
  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { moduleName: "LMoP" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/name/i);
  });

  it("returns 400 when name is blank string", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { name: "   " }));
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/campaigns/global — success ─────────────────────────────────────

describe("POST /api/campaigns/global — success", () => {
  beforeEach(() => {
    mockedStorage.saveCampaignTemplate.mockResolvedValue(undefined as any);
  });

  it("returns 201 with created template", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", {
      name: "Lost Mine",
      moduleName: "LMoP",
      description: "A starter adventure",
      chapters: [{ id: "ch-1", title: "Chapter 1", order: 0 }],
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Lost Mine");
    expect(data.moduleName).toBe("LMoP");
    expect(data.description).toBe("A starter adventure");
    expect(data.isGlobal).toBe(true);
    expect(data.chapters).toHaveLength(1);
  });

  it("defaults moduleName to empty string when omitted", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { name: "No Module" }));
    expect(res.status).toBe(201);
    expect((await res.json()).moduleName).toBe("");
  });

  it("passes through chapter optional fields (description, levelRange, location)", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", {
      name: "Test",
      chapters: [{
        id: "ch-1", title: "Chapter 1", order: 0,
        description: "Intro", levelRange: "1-4", location: "Phandalin",
      }],
    }));
    const ch = (await res.json()).chapters[0];
    expect(ch.description).toBe("Intro");
    expect(ch.levelRange).toBe("1-4");
    expect(ch.location).toBe("Phandalin");
  });

  it("strips invalid chapters and keeps valid ones", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", {
      name: "Test Template",
      chapters: [
        { id: "ch-1", title: "Valid", order: 0 },
        { id: "", title: "Empty id", order: 1 },
        { id: "ch-3", title: "", order: 2 },
        { title: "Missing id", order: 3 },
        { id: "ch-5", title: "Missing order" },
      ],
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.chapters).toHaveLength(1);
    expect(data.chapters[0].id).toBe("ch-1");
  });

  it("defaults chapters to empty array when omitted", async () => {
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { name: "No Chapters" }));
    expect(res.status).toBe(201);
    expect((await res.json()).chapters).toEqual([]);
  });

  it("returns 500 when saveCampaignTemplate throws", async () => {
    mockedStorage.saveCampaignTemplate.mockRejectedValue(new Error("write failed"));
    const res = await POST(makeRouteRequest(BASE_URL, "POST", { name: "Test" }));
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/campaigns/global ────────────────────────────────────────────────

describe("PUT /api/campaigns/global", () => {
  it("returns 501 for admin", async () => {
    const res = await PUT(makeRouteRequest(BASE_URL, "PUT", {}));
    expect(res.status).toBe(501);
  });

  it("returns 403 when not admin", async () => {
    mockAdminDenied(mockedRequireAdmin as jest.Mock, 403);
    const res = await PUT(makeRouteRequest(BASE_URL, "PUT", {}));
    expect(res.status).toBe(403);
  });
});
