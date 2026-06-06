/**
 * @jest-environment node
 */
import { POST } from "@/app/api/campaigns/[id]/members/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { DuplicateMemberError } from "@/lib/errors";
import {
  MOCK_AUTH,
  makeRouteRequest,
} from "@/tests/unit/helpers/route.test.helpers";
import { CampaignMember } from "@/lib/types";

jest.mock("@/lib/middleware");

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    addMember: jest.fn(),
    updateMemberStatus: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  addMember: jest.MockedFunction<typeof storage.addMember>;
  updateMemberStatus: jest.MockedFunction<typeof storage.updateMemberStatus>;
};

const CAMPAIGN_ID = "camp-1";
const TARGET_USER_ID = "target-user";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const ACTIVE_DM: CampaignMember = {
  id: "mem-dm",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "dm",
  status: "active",
  history: [{ action: "active", by: MOCK_AUTH.userId, at: new Date() }],
};

const makePostRequest = (body: unknown) =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/members`, "POST", body);

beforeEach(() => {
  jest.clearAllMocks();
  mockedStorage.addMember.mockResolvedValue(undefined);
  mockedStorage.updateMemberStatus.mockResolvedValue(undefined);
});

describe("POST /api/campaigns/[id]/members", () => {
  describe("unauthenticated", () => {
    it("returns 401 when not authenticated", async () => {
      mockedRequireAuth.mockReturnValue(
        { status: 401, json: async () => ({ error: "Unauthorized" }) } as never
      );
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(401);
    });
  });

  describe("successful new invite", () => {
    beforeEach(() => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)   // caller check
        .mockResolvedValueOnce(null);        // target check
    });

    it("returns 201 with { id, status: 'invited' }", async () => {
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(typeof body.id).toBe("string");
      expect(body.status).toBe("invited");
    });

    it("calls addMember with correct shape", async () => {
      await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(mockedStorage.addMember).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: CAMPAIGN_ID,
          userId: TARGET_USER_ID,
          role: "player",
          status: "invited",
          history: expect.arrayContaining([
            expect.objectContaining({ action: "invited", by: MOCK_AUTH.userId }),
          ]),
        })
      );
    });

    it("does not call updateMemberStatus", async () => {
      await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });
  });

  describe("re-invite declined member", () => {
    const DECLINED_MEMBER: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "declined",
      history: [{ action: "declined", by: TARGET_USER_ID, at: new Date() }],
    };

    beforeEach(() => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(DECLINED_MEMBER);
    });

    it("returns 201 with existing id and status 'invited'", async () => {
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBe("mem-target");
      expect(body.status).toBe("invited");
    });

    it("calls updateMemberStatus with 'invited' and role 'player'", async () => {
      await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(mockedStorage.updateMemberStatus).toHaveBeenCalledWith(
        CAMPAIGN_ID, TARGET_USER_ID, "invited", MOCK_AUTH.userId, "player"
      );
    });

    it("does not call addMember", async () => {
      await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(mockedStorage.addMember).not.toHaveBeenCalled();
    });
  });

  describe("re-invite removed member", () => {
    const REMOVED_MEMBER: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "removed",
      history: [{ action: "removed", by: MOCK_AUTH.userId, at: new Date() }],
    };

    beforeEach(() => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(REMOVED_MEMBER);
    });

    it("returns 201 with existing id and status 'invited'", async () => {
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBe("mem-target");
      expect(body.status).toBe("invited");
    });

    it("calls updateMemberStatus with 'invited' and role 'player'", async () => {
      await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(mockedStorage.updateMemberStatus).toHaveBeenCalledWith(
        CAMPAIGN_ID, TARGET_USER_ID, "invited", MOCK_AUTH.userId, "player"
      );
    });
  });

  describe("duplicate rejection", () => {
    const ACTIVE_TARGET: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "active",
      history: [{ action: "active", by: TARGET_USER_ID, at: new Date() }],
    };
    const INVITED_TARGET: CampaignMember = {
      id: "mem-target",
      campaignId: CAMPAIGN_ID,
      userId: TARGET_USER_ID,
      role: "player",
      status: "invited",
      history: [{ action: "invited", by: MOCK_AUTH.userId, at: new Date() }],
    };

    beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

    it("returns 409 when target is already active", async () => {
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(ACTIVE_TARGET);

      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(409);
      expect(mockedStorage.addMember).not.toHaveBeenCalled();
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });

    it("returns 409 when target is already invited", async () => {
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(INVITED_TARGET);

      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(409);
      expect(mockedStorage.addMember).not.toHaveBeenCalled();
      expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
    });
  });

  describe("self-invite", () => {
    it("returns 400 when userId equals auth.userId", async () => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      const response = await POST(
        makePostRequest({ userId: MOCK_AUTH.userId }),
        { params: PARAMS }
      );
      expect(response.status).toBe(400);
      expect(mockedStorage.getMember).not.toHaveBeenCalled();
    });
  });

  describe("missing/invalid body", () => {
    beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

    it("returns 400 when userId is missing", async () => {
      const response = await POST(makePostRequest({}), { params: PARAMS });
      expect(response.status).toBe(400);
    });

    it("returns 400 when userId is a number", async () => {
      const response = await POST(makePostRequest({ userId: 123 }), { params: PARAMS });
      expect(response.status).toBe(400);
    });

    it("returns 400 when body is malformed JSON", async () => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      const req = new Request(
        `http://localhost/api/campaigns/${CAMPAIGN_ID}/members`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "not-json" }
      );
      const response = await POST(req as never, { params: PARAMS });
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid JSON");
    });
  });

  describe("non-DM caller", () => {
    beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

    it("returns 403 when caller is not a member", async () => {
      mockedStorage.getMember.mockResolvedValueOnce(null);
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(403);
    });

    it("returns 403 when caller is a player", async () => {
      const playerMember: CampaignMember = {
        id: "mem-caller",
        campaignId: CAMPAIGN_ID,
        userId: MOCK_AUTH.userId,
        role: "player",
        status: "active",
        history: [{ action: "active", by: MOCK_AUTH.userId, at: new Date() }],
      };
      mockedStorage.getMember.mockResolvedValueOnce(playerMember);
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(403);
    });

    it("returns 403 when caller is DM with 'invited' status (not active)", async () => {
      const invitedDm: CampaignMember = {
        id: "mem-caller",
        campaignId: CAMPAIGN_ID,
        userId: MOCK_AUTH.userId,
        role: "dm",
        status: "invited",
        history: [{ action: "invited", by: "other", at: new Date() }],
      };
      mockedStorage.getMember.mockResolvedValueOnce(invitedDm);
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(403);
    });
  });

  describe("race condition / DuplicateMemberError from addMember", () => {
    it("returns 409 when addMember throws DuplicateMemberError", async () => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(null);
      mockedStorage.addMember.mockRejectedValueOnce(
        new DuplicateMemberError(CAMPAIGN_ID, TARGET_USER_ID)
      );
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(409);
    });
  });

  describe("storage error", () => {
    it("returns 500 when addMember throws unexpected error", async () => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(null);
      mockedStorage.addMember.mockRejectedValueOnce(new Error("DB failure"));
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).not.toHaveProperty("stack");
      expect(body.error).toBe("Internal server error");
    });

    it("returns 500 when updateMemberStatus throws unexpected error", async () => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      const declinedMember: CampaignMember = {
        id: "mem-target",
        campaignId: CAMPAIGN_ID,
        userId: TARGET_USER_ID,
        role: "player",
        status: "declined",
        history: [{ action: "declined", by: TARGET_USER_ID, at: new Date() }],
      };
      mockedStorage.getMember
        .mockResolvedValueOnce(ACTIVE_DM)
        .mockResolvedValueOnce(declinedMember);
      mockedStorage.updateMemberStatus.mockRejectedValueOnce(new Error("DB failure"));
      const response = await POST(makePostRequest({ userId: TARGET_USER_ID }), { params: PARAMS });
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).not.toHaveProperty("stack");
    });
  });
});
