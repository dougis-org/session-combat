/**
 * @jest-environment node
 */
import { DELETE } from "@/app/api/campaigns/[id]/characters/[cid]/route";
import { storage } from "@/lib/storage";
import { CampaignMember, Character } from "@/lib/types";
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
    removeShare: jest.fn(),
    loadCharacterById: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  removeShare: jest.MockedFunction<typeof storage.removeShare>;
  loadCharacterById: jest.MockedFunction<typeof storage.loadCharacterById>;
};

const CAMPAIGN_ID = "camp-1";
const CHARACTER_ID = "char-1";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID, cid: CHARACTER_ID });

const ACTIVE_PLAYER: CampaignMember = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "active",
  history: [],
};

const OWN_CHARACTER = {
  id: CHARACTER_ID,
  userId: MOCK_AUTH.userId,
  name: "Hero",
} as unknown as Character;

const makeDeleteRequest = () =>
  makeRouteRequest(
    `http://localhost/api/campaigns/${CAMPAIGN_ID}/characters/${CHARACTER_ID}`,
    "DELETE"
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
});

describe("DELETE /api/campaigns/[id]/characters/[cid]", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(DELETE, makeDeleteRequest, PARAMS);
  });

  it("T5-1: returns 403 when caller is not a member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T5-2: returns 404 when character not found", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue(null);
    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(response.status).toBe(404);
  });

  it("T5-3: returns 403 when character is owned by someone else", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue({
      ...OWN_CHARACTER,
      userId: "other-user",
    });
    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T5-4: returns 404 when removeShare returns false", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue(OWN_CHARACTER);
    mockedStorage.removeShare.mockResolvedValue(false);
    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(response.status).toBe(404);
  });

  it("T5-5: returns 204 on successful unshare", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue(OWN_CHARACTER);
    mockedStorage.removeShare.mockResolvedValue(true);
    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
    expect(response.status).toBe(204);
  });
});
