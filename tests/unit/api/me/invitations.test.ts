/**
 * @jest-environment node
 */
import { GET } from "@/app/api/me/invitations/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { MOCK_AUTH, makeRouteRequest } from "@/tests/unit/helpers/route.test.helpers";
import { CampaignMember } from "@/lib/types";

jest.mock("@/lib/middleware");

jest.mock("@/lib/storage", () => ({
  storage: {
    listInvitationsForUser: jest.fn(),
    getUsersByIds: jest.fn(),
    getCampaignsByIds: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage) as {
  listInvitationsForUser: jest.MockedFunction<typeof storage.listInvitationsForUser>;
  getUsersByIds: jest.MockedFunction<typeof storage.getUsersByIds>;
  getCampaignsByIds: jest.MockedFunction<typeof storage.getCampaignsByIds>;
};

const makeGetRequest = () =>
  makeRouteRequest("http://localhost/api/me/invitations", "GET");

const DM_ID = "507f1f77bcf86cd799439011";
const DM_ID_2 = "507f1f77bcf86cd799439012";

const makeInvitation = (overrides: Partial<CampaignMember> = {}): CampaignMember => ({
  id: "mem-1",
  campaignId: "camp-1",
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "invited",
  history: [{ action: "invited", by: DM_ID, at: new Date("2026-06-01T10:00:00Z") }],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/me/invitations — unauthenticated", () => {
  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue({ status: 401 } as never);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe("GET /api/me/invitations — empty list", () => {
  it("returns 200 with empty array when no pending invitations", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.listInvitationsForUser.mockResolvedValue([]);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ invitations: [] });
    expect(mockedStorage.getCampaignsByIds).not.toHaveBeenCalled();
  });
});

describe("GET /api/me/invitations — pending invitations", () => {
  beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

  it("returns correct shape for pending invitations", async () => {
    const invAt = new Date("2026-06-01T10:00:00Z");
    mockedStorage.listInvitationsForUser.mockResolvedValue([
      makeInvitation({ history: [{ action: "invited", by: DM_ID, at: invAt }] }),
    ]);
    mockedStorage.getUsersByIds.mockResolvedValue({ [DM_ID]: "theDM" });
    mockedStorage.getCampaignsByIds.mockResolvedValue([{ id: "camp-1", name: "Dragon Campaign" }]);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.invitations).toHaveLength(1);
    const inv = body.invitations[0];
    expect(inv.id).toBe("mem-1");
    expect(inv.campaignId).toBe("camp-1");
    expect(inv.campaignName).toBe("Dragon Campaign");
    expect(inv.invitedBy).toBe("theDM");
    expect(inv.invitedAt).toBe(invAt.toISOString());
  });

  it("uses the last 'invited' history entry for re-invited member", async () => {
    const firstAt = new Date("2026-05-01T10:00:00Z");
    const lastAt = new Date("2026-06-01T10:00:00Z");
    mockedStorage.listInvitationsForUser.mockResolvedValue([
      makeInvitation({
        history: [
          { action: "invited", by: DM_ID, at: firstAt },
          { action: "declined", by: MOCK_AUTH.userId, at: new Date("2026-05-15") },
          { action: "invited", by: DM_ID_2, at: lastAt },
        ],
      }),
    ]);
    mockedStorage.getUsersByIds.mockResolvedValue({ [DM_ID_2]: "anotherDM" });
    mockedStorage.getCampaignsByIds.mockResolvedValue([{ id: "camp-1", name: "Dragon Campaign" }]);

    const response = await GET(makeGetRequest());

    const body = await response.json();
    const inv = body.invitations[0];
    expect(inv.invitedBy).toBe("anotherDM");
    expect(inv.invitedAt).toBe(lastAt.toISOString());
  });

  it("falls back to 'Unknown user' when inviter username is missing", async () => {
    mockedStorage.listInvitationsForUser.mockResolvedValue([
      makeInvitation({ history: [{ action: "invited", by: DM_ID, at: new Date() }] }),
    ]);
    mockedStorage.getUsersByIds.mockResolvedValue({});
    mockedStorage.getCampaignsByIds.mockResolvedValue([{ id: "camp-1", name: "Dragon Campaign" }]);

    const response = await GET(makeGetRequest());

    const body = await response.json();
    expect(body.invitations[0].invitedBy).toBe("Unknown user");
  });

  it("falls back to 'Unknown user' when history is empty", async () => {
    mockedStorage.listInvitationsForUser.mockResolvedValue([
      makeInvitation({ history: [] }),
    ]);
    mockedStorage.getUsersByIds.mockResolvedValue({});
    mockedStorage.getCampaignsByIds.mockResolvedValue([{ id: "camp-1", name: "Dragon Campaign" }]);

    const response = await GET(makeGetRequest());

    const body = await response.json();
    expect(body.invitations[0].invitedBy).toBe("Unknown user");
    expect(body.invitations[0].invitedAt).toBeNull();
  });

  it("makes exactly one getCampaignsByIds and getUsersByIds call regardless of invitation count", async () => {
    mockedStorage.listInvitationsForUser.mockResolvedValue([
      makeInvitation({ id: "mem-1", campaignId: "camp-1", history: [{ action: "invited", by: DM_ID, at: new Date() }] }),
      makeInvitation({ id: "mem-2", campaignId: "camp-2", history: [{ action: "invited", by: DM_ID_2, at: new Date() }] }),
    ]);
    mockedStorage.getUsersByIds.mockResolvedValue({ [DM_ID]: "dm1", [DM_ID_2]: "dm2" });
    mockedStorage.getCampaignsByIds.mockResolvedValue([
      { id: "camp-1", name: "Campaign 1" },
      { id: "camp-2", name: "Campaign 2" },
    ]);

    await GET(makeGetRequest());

    expect(mockedStorage.getUsersByIds).toHaveBeenCalledTimes(1);
    expect(mockedStorage.getCampaignsByIds).toHaveBeenCalledTimes(1);
    expect(mockedStorage.getUsersByIds).toHaveBeenCalledWith(
      expect.arrayContaining([DM_ID, DM_ID_2])
    );
  });
});

describe("GET /api/me/invitations — storage error", () => {
  it("returns 500 with no internals when listInvitationsForUser throws", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.listInvitationsForUser.mockRejectedValue(new Error("DB down"));

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).not.toHaveProperty("stack");
    expect(body.error).toBe("Internal server error");
  });
});
