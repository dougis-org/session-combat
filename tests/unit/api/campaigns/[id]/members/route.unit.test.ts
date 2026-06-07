/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/campaigns/[id]/members/route";
import { storage } from "@/lib/storage";
import { DuplicateMemberError } from "@/lib/errors";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
  itReturns401WithParams,
} from "@/tests/unit/helpers/route.test.helpers";
import { CampaignMember } from "@/lib/types";
import { getDatabase } from "@/lib/db";

jest.mock("@/lib/db");

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    addMember: jest.fn(),
    updateMemberStatus: jest.fn(),
    listMembersForCampaign: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  addMember: jest.MockedFunction<typeof storage.addMember>;
  updateMemberStatus: jest.MockedFunction<typeof storage.updateMemberStatus>;
  listMembersForCampaign: jest.MockedFunction<typeof storage.listMembersForCampaign>;
};

const mockedGetDatabase = jest.mocked(getDatabase);

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

const MEMBER_1: CampaignMember = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: "507f1f77bcf86cd799439011",
  role: "player",
  status: "active",
  history: [],
};
const MEMBER_2: CampaignMember = {
  id: "mem-2",
  campaignId: CAMPAIGN_ID,
  userId: "507f1f77bcf86cd799439012",
  role: "dm",
  status: "active",
  history: [],
};

function mockUsersDb(userDocs: { _id: { toString: () => string }; username: string }[]) {
  const findMock = jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue(userDocs),
  });
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({ find: findMock }),
  } as any);
  return findMock;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedStorage.addMember.mockResolvedValue(undefined);
  mockedStorage.updateMemberStatus.mockResolvedValue(undefined);
});

describe("POST /api/campaigns/[id]/members", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(POST, makePostRequest.bind(null, { userId: TARGET_USER_ID }), PARAMS);
  });

  describe("successful new invite", () => {
    beforeEach(() => {
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
      const response = await POST(
        makePostRequest({ userId: MOCK_AUTH.userId }),
        { params: PARAMS }
      );
      expect(response.status).toBe(400);
      expect(mockedStorage.getMember).not.toHaveBeenCalled();
    });
  });

  describe("missing/invalid body", () => {
    it("returns 400 when userId is missing", async () => {
      const response = await POST(makePostRequest({}), { params: PARAMS });
      expect(response.status).toBe(400);
    });

    it("returns 400 when userId is a number", async () => {
      const response = await POST(makePostRequest({ userId: 123 }), { params: PARAMS });
      expect(response.status).toBe(400);
    });

    it("returns 400 when body is malformed JSON", async () => {
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

const makeGetRequest = () =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/members`, "GET");

describe("GET /api/campaigns/[id]/members", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(GET, makeGetRequest, PARAMS);
  });

  describe("active member retrieves enriched list", () => {
    beforeEach(() => {
      mockedStorage.getMember.mockResolvedValueOnce(ACTIVE_DM);
      mockedStorage.listMembersForCampaign.mockResolvedValueOnce([MEMBER_1, MEMBER_2]);
      mockUsersDb([
        { _id: { toString: () => MEMBER_1.userId }, username: "alice" },
        { _id: { toString: () => MEMBER_2.userId }, username: "bob" },
      ]);
    });

    it("returns 200 with enriched member list", async () => {
      const response = await GET(makeGetRequest(), { params: PARAMS });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.members).toHaveLength(2);
      expect(body.members[0]).toMatchObject({ id: "mem-1", userId: MEMBER_1.userId, username: "alice", role: "player", status: "active" });
      expect(body.members[1]).toMatchObject({ id: "mem-2", userId: MEMBER_2.userId, username: "bob", role: "dm", status: "active" });
    });
  });

  describe("username enrichment uses $in (no N+1)", () => {
    it("calls db.collection('users').find exactly once regardless of member count", async () => {
      mockedStorage.getMember.mockResolvedValueOnce(ACTIVE_DM);
      mockedStorage.listMembersForCampaign.mockResolvedValueOnce([MEMBER_1, MEMBER_2]);
      const findMock = mockUsersDb([]);
      await GET(makeGetRequest(), { params: PARAMS });
      expect(findMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("access control", () => {
    it("returns 403 when caller is not a member", async () => {
      mockedStorage.getMember.mockResolvedValueOnce(null);
      const response = await GET(makeGetRequest(), { params: PARAMS });
      expect(response.status).toBe(403);
    });

    it("returns 403 when caller has status 'invited'", async () => {
      const invitedMember: CampaignMember = {
        id: "mem-caller",
        campaignId: CAMPAIGN_ID,
        userId: MOCK_AUTH.userId,
        role: "player",
        status: "invited",
        history: [],
      };
      mockedStorage.getMember.mockResolvedValueOnce(invitedMember);
      const response = await GET(makeGetRequest(), { params: PARAMS });
      expect(response.status).toBe(403);
    });
  });
});
