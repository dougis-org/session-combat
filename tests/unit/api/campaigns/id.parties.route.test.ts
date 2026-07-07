/**
 * @jest-environment node
 */
import { GET } from "@/app/api/campaigns/[id]/parties/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itReturns401WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    loadPartiesByCampaign: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage);

const BASE_URL = "http://localhost/api/campaigns/camp-1/parties";
const makeGetRequest = () => makeRouteRequest(BASE_URL, "GET");
const PARAMS = Promise.resolve({ id: "camp-1" });

describe("GET /api/campaigns/[id]/parties", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getMember.mockResolvedValue({ status: "active", role: "player" } as any);
    mockedStorage.loadPartiesByCampaign.mockResolvedValue([
      { id: "party-1", members: [] },
      { id: "party-2", members: [] },
    ] as any);
  });

  itReturns401WithParams(GET, makeGetRequest, PARAMS);

  it("returns 200 with all parties for an active player", async () => {
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body.map((p: any) => p.id)).toEqual(["party-1", "party-2"]);
  });

  it("returns 200 with all parties for an active dm", async () => {
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "dm" } as any);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
  });

  it("returns 403 when caller is not a campaign member", async () => {
    mockedStorage.getMember.mockResolvedValueOnce(null as any);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("returns 403 when caller's membership is not active", async () => {
    mockedStorage.getMember.mockResolvedValueOnce({ status: "left", role: "player" } as any);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("returns 200 with an empty array when the campaign has no parties", async () => {
    mockedStorage.loadPartiesByCampaign.mockResolvedValue([]);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  itReturns500WithParams(
    GET,
    makeGetRequest,
    PARAMS,
    () => {
      mockedStorage.getMember.mockRejectedValueOnce(new Error("DB error"));
    },
    "returns 500 when storage throws"
  );
});
