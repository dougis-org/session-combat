/**
 * @jest-environment node
 */
import { DELETE } from "@/app/api/campaigns/[id]/members/[userId]/route";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
  itReturns401WithParams,
} from "@/tests/unit/helpers/route.test.helpers";
import { CampaignMember } from "@/lib/types";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    updateMemberStatus: jest.fn(),
    listAllSharesForCampaign: jest.fn(),
    setPartyMemberLeftAt: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  updateMemberStatus: jest.MockedFunction<typeof storage.updateMemberStatus>;
  listAllSharesForCampaign: jest.MockedFunction<typeof storage.listAllSharesForCampaign>;
  setPartyMemberLeftAt: jest.MockedFunction<typeof storage.setPartyMemberLeftAt>;
};

const CAMPAIGN_ID = "camp-1";
const TARGET_USER_ID = "target-user-456";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID, userId: TARGET_USER_ID });

const ACTIVE_DM: CampaignMember = {
  id: "mem-dm",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "dm",
  status: "active",
  history: [],
};

const makeDeleteRequest = () =>
  makeRouteRequest(
    `http://localhost/api/campaigns/${CAMPAIGN_ID}/members/${TARGET_USER_ID}`,
    "DELETE"
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedStorage.updateMemberStatus.mockResolvedValue(undefined);
  mockedStorage.listAllSharesForCampaign.mockResolvedValue([]);
  mockedStorage.setPartyMemberLeftAt.mockResolvedValue();
});

describe("DELETE /api/campaigns/[id]/members/[userId]", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(DELETE, makeDeleteRequest, PARAMS);
  });

  describe("DM removes active member", () => {
    const ACTIVE_TARGET: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "active",
      history: [],
    };

    beforeEach(() => {
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(ACTIVE_TARGET);
    });

    it("returns 200 with { status: 'removed' }", async () => {
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ status: "removed" });
    });

    it("calls updateMemberStatus with correct args", async () => {
      await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(mockedStorage.updateMemberStatus).toHaveBeenCalledWith(
        CAMPAIGN_ID,
        TARGET_USER_ID,
        "removed",
        MOCK_AUTH.userId
      );
    });
  });

  describe("DM removes invited member", () => {
    const INVITED_TARGET: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "invited",
      history: [],
    };

    it("returns 200 with { status: 'removed' }", async () => {
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(INVITED_TARGET);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ status: "removed" });
    });
  });

  describe("access control", () => {
    it("returns 403 when caller is not a member", async () => {
      mockedStorage.getMember.mockResolvedValueOnce(null);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(403);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });

    it("returns 403 when caller is a player", async () => {
      const playerCaller: CampaignMember = {
        id: "mem-caller",
        campaignId: CAMPAIGN_ID,
        userId: MOCK_AUTH.userId,
        role: "player",
        status: "active",
        history: [],
      };
      mockedStorage.getMember.mockResolvedValueOnce(playerCaller);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(403);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });

    it("returns 403 when caller is DM with status 'invited'", async () => {
      const invitedDm: CampaignMember = {
        id: "mem-dm",
        campaignId: CAMPAIGN_ID,
        userId: MOCK_AUTH.userId,
        role: "dm",
        status: "invited",
        history: [],
      };
      mockedStorage.getMember.mockResolvedValueOnce(invitedDm);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(403);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });
  });

  describe("self-remove guard", () => {
    it("returns 400 when DM tries to remove themselves", async () => {
      const selfParams = Promise.resolve({ id: CAMPAIGN_ID, userId: MOCK_AUTH.userId });
      mockedStorage.getMember.mockResolvedValueOnce(ACTIVE_DM);
      const selfReq = makeRouteRequest(
        `http://localhost/api/campaigns/${CAMPAIGN_ID}/members/${MOCK_AUTH.userId}`,
        "DELETE"
      );
      const response = await DELETE(selfReq, { params: selfParams });
      expect(response.status).toBe(400);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });
  });

  describe("target not found / non-removable status", () => {
    it("returns 404 when target member not found", async () => {
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(null);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(404);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });

    it("returns 404 when target is already removed", async () => {
      const removedTarget: CampaignMember = {
        id: "mem-target",
        campaignId: CAMPAIGN_ID,
        userId: TARGET_USER_ID,
        role: "player",
        status: "removed",
        history: [],
      };
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(removedTarget);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(404);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });

    it("returns 404 when target has status 'declined'", async () => {
      const declinedTarget: CampaignMember = {
        id: "mem-target",
        campaignId: CAMPAIGN_ID,
        userId: TARGET_USER_ID,
        role: "player",
        status: "declined",
        history: [],
      };
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(declinedTarget);
      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });
      expect(response.status).toBe(404);
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });
  });

  describe("B5: party cleanup on member removal", () => {
    const ACTIVE_TARGET: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "active",
      history: [],
    };

    beforeEach(() => {
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(ACTIVE_TARGET);
    });

    it("B5-1: cascades leftAt to all shares owned by removed member", async () => {
      const shares = [
        { id: "s1", campaignId: CAMPAIGN_ID, characterId: "char-X", userId: TARGET_USER_ID, sharedAt: new Date() },
        { id: "s2", campaignId: CAMPAIGN_ID, characterId: "char-Y", userId: TARGET_USER_ID, sharedAt: new Date() },
      ];
      mockedStorage.listAllSharesForCampaign.mockResolvedValue(shares as any);

      await DELETE(makeDeleteRequest(), { params: PARAMS });

      expect(mockedStorage.setPartyMemberLeftAt).toHaveBeenCalledTimes(2);
      expect(mockedStorage.setPartyMemberLeftAt).toHaveBeenCalledWith(CAMPAIGN_ID, "char-X", expect.any(Date));
      expect(mockedStorage.setPartyMemberLeftAt).toHaveBeenCalledWith(CAMPAIGN_ID, "char-Y", expect.any(Date));
    });

    it("B5-2: member with no shares — removal still returns 200", async () => {
      mockedStorage.listAllSharesForCampaign.mockResolvedValue([]);

      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });

      expect(response.status).toBe(200);
      expect(mockedStorage.setPartyMemberLeftAt).not.toHaveBeenCalled();
    });

    it("B5-3: cleanup error does not fail removal response", async () => {
      mockedStorage.listAllSharesForCampaign.mockRejectedValue(new Error("cleanup failed"));

      const response = await DELETE(makeDeleteRequest(), { params: PARAMS });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ status: "removed" });
    });
  });
});
