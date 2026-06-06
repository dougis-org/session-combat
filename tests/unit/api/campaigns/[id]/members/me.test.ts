/**
 * @jest-environment node
 */
import { PATCH } from "@/app/api/campaigns/[id]/members/me/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { MOCK_AUTH, makeRouteRequest } from "@/tests/unit/helpers/route.test.helpers";
import { CampaignMember } from "@/lib/types";

jest.mock("@/lib/middleware");

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    updateMemberStatus: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  updateMemberStatus: jest.MockedFunction<typeof storage.updateMemberStatus>;
};

const CAMPAIGN_ID = "camp-1";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const makePatchRequest = (body: unknown) =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/members/me`, "PATCH", body);

const makeInvitedMember = (overrides: Partial<CampaignMember> = {}): CampaignMember => ({
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "invited",
  history: [{ action: "invited", by: "dm-1", at: new Date() }],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedStorage.updateMemberStatus.mockResolvedValue(undefined);
});

describe("PATCH /api/campaigns/[id]/members/me — unauthenticated", () => {
  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue({ status: 401 } as never);
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/campaigns/[id]/members/me — input validation", () => {
  beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

  it("returns 400 for missing action field", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember());
    const response = await PATCH(makePatchRequest({}), { params: PARAMS });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("accept");
    expect(body.error).toContain("decline");
  });

  it("returns 400 for invalid action value", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember());
    const response = await PATCH(makePatchRequest({ action: "maybe" }), { params: PARAMS });
    expect(response.status).toBe(400);
  });

  it("returns 400 with 'Invalid JSON payload' for malformed JSON", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const req = new Request(
      `http://localhost/api/campaigns/${CAMPAIGN_ID}/members/me`,
      { method: "PATCH", headers: { "Content-Type": "application/json", cookie: "auth-token=t" }, body: "not-json" }
    );
    const response = await PATCH(req as never, { params: PARAMS });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON payload");
  });
});

describe("PATCH /api/campaigns/[id]/members/me — not found", () => {
  beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

  it("returns 404 when no membership exists", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("No invitation found");
  });

  it("returns 404 for removed membership", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "removed" }));
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("No invitation found");
  });
});

describe("PATCH /api/campaigns/[id]/members/me — accept", () => {
  beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

  it("invited + accept → 200 { status: 'active' } and calls updateMemberStatus with 'active'", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "invited" }));
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("active");
    expect(mockedStorage.updateMemberStatus).toHaveBeenCalledWith(
      CAMPAIGN_ID, MOCK_AUTH.userId, "active", MOCK_AUTH.userId
    );
  });

  it("active + accept → 200 { status: 'active' } and does NOT call updateMemberStatus", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "active" }));
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("active");
    expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
  });

  it("declined + accept → 409 with conflict message", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "declined" }));
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("You have already declined this invitation");
  });
});

describe("PATCH /api/campaigns/[id]/members/me — decline", () => {
  beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

  it("invited + decline → 200 { status: 'declined' } and calls updateMemberStatus with 'declined'", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "invited" }));
    const response = await PATCH(makePatchRequest({ action: "decline" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("declined");
    expect(mockedStorage.updateMemberStatus).toHaveBeenCalledWith(
      CAMPAIGN_ID, MOCK_AUTH.userId, "declined", MOCK_AUTH.userId
    );
  });

  it("declined + decline → 200 { status: 'declined' } and does NOT call updateMemberStatus", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "declined" }));
    const response = await PATCH(makePatchRequest({ action: "decline" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("declined");
    expect(mockedStorage.updateMemberStatus).not.toHaveBeenCalled();
  });

  it("active + decline → 409 with conflict message", async () => {
    mockedStorage.getMember.mockResolvedValue(makeInvitedMember({ status: "active" }));
    const response = await PATCH(makePatchRequest({ action: "decline" }), { params: PARAMS });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("You have already accepted this invitation");
  });
});

describe("PATCH /api/campaigns/[id]/members/me — storage error", () => {
  beforeEach(() => mockedRequireAuth.mockReturnValue(MOCK_AUTH));

  it("returns 500 with no internals when getMember throws", async () => {
    mockedStorage.getMember.mockRejectedValue(new Error("DB down"));
    const response = await PATCH(makePatchRequest({ action: "accept" }), { params: PARAMS });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).not.toHaveProperty("stack");
    expect(body.error).toBe("Internal server error");
  });
});
