/**
 * @jest-environment node
 */
import { GET } from "@/app/api/campaigns/[id]/members/me/route";
import { storage } from "@/lib/storage";
import { CampaignMember } from "@/lib/types";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
  itReturns401WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
};

const CAMPAIGN_ID = "camp-1";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const ACTIVE_PLAYER: CampaignMember = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "active",
  history: [],
};

const makeGetRequest = () =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/members/me`, "GET");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
});

describe("GET /api/campaigns/[id]/members/me", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(GET, makeGetRequest, PARAMS);
  });

  it("returns 404 when caller is not a member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(404);
  });

  it("returns 200 with the member record", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.role).toBe("player");
    expect(body.status).toBe("active");
  });
});
