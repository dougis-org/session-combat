import { DELETE } from "@/app/api/campaigns/global/[id]/route";
import { requireAdmin } from "@/lib/api-helpers";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  mockAdminDenied,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/api-helpers", () => ({ requireAdmin: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: { deleteCampaignTemplate: jest.fn() },
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedStorage = jest.mocked(storage);

const TEMPLATE_ID = "tpl-1";
const BASE_URL = `http://localhost/api/campaigns/global/${TEMPLATE_ID}`;
const PARAMS = Promise.resolve({ id: TEMPLATE_ID });

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue(null);
});

describe("DELETE /api/campaigns/global/[id]", () => {
  it("returns 200 when template is deleted", async () => {
    mockedStorage.deleteCampaignTemplate.mockResolvedValue(true as any);
    const res = await DELETE(makeRouteRequest(BASE_URL, "DELETE"), { params: PARAMS });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("returns 404 when template does not exist", async () => {
    mockedStorage.deleteCampaignTemplate.mockResolvedValue(false as any);
    const res = await DELETE(makeRouteRequest(BASE_URL, "DELETE"), { params: PARAMS });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not found/i);
  });

  it("returns 401 when not authenticated", async () => {
    mockAdminDenied(mockedRequireAdmin as jest.Mock, 401);
    const res = await DELETE(makeRouteRequest(BASE_URL, "DELETE"), { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not admin", async () => {
    mockAdminDenied(mockedRequireAdmin as jest.Mock, 403);
    const res = await DELETE(makeRouteRequest(BASE_URL, "DELETE"), { params: PARAMS });
    expect(res.status).toBe(403);
  });

  it("returns 500 when storage throws", async () => {
    mockedStorage.deleteCampaignTemplate.mockRejectedValue(new Error("DB error"));
    const res = await DELETE(makeRouteRequest(BASE_URL, "DELETE"), { params: PARAMS });
    expect(res.status).toBe(500);
  });
});
