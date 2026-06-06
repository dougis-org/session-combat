/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import { storage } from "@/lib/storage";

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    loadCampaignByIdAny: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  loadCampaignByIdAny: jest.MockedFunction<typeof storage.loadCampaignByIdAny>;
};

const MOCK_CAMPAIGN = {
  id: "camp-1",
  userId: "owner-user",
  name: "Test Campaign",
  moduleName: "",
  chapters: [],
  status: "active" as const,
  notes: "",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const makeMember = (role: "dm" | "player", status: "active" | "invited" | "declined" | "removed") => ({
  id: "mem-1",
  campaignId: "camp-1",
  userId: "user-1",
  role,
  status,
  history: [{ action: status as "active" | "invited" | "declined" | "removed", by: "owner-user", at: new Date("2026-06-01") }],
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("assertCampaignAccess", () => {
  it("returns { campaign, role: 'dm' } for active DM member", async () => {
    mockedStorage.getMember.mockResolvedValue(makeMember("dm", "active"));
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(MOCK_CAMPAIGN);

    const result = await assertCampaignAccess("camp-1", "user-1");

    expect(result).not.toBeInstanceOf(NextResponse);
    const { campaign, role } = result as { campaign: typeof MOCK_CAMPAIGN; role: string };
    expect(role).toBe("dm");
    expect(campaign.id).toBe("camp-1");
  });

  it("returns { campaign, role: 'player' } for active player member", async () => {
    mockedStorage.getMember.mockResolvedValue(makeMember("player", "active"));
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(MOCK_CAMPAIGN);

    const result = await assertCampaignAccess("camp-1", "user-1");

    expect(result).not.toBeInstanceOf(NextResponse);
    const { role } = result as { campaign: unknown; role: string };
    expect(role).toBe("player");
  });

  it("returns 404 NextResponse when getMember returns null (non-member)", async () => {
    mockedStorage.getMember.mockResolvedValue(null);

    const result = await assertCampaignAccess("camp-1", "unknown-user");

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Campaign not found" });
  });

  it("returns 404 NextResponse when member status is 'invited'", async () => {
    mockedStorage.getMember.mockResolvedValue(makeMember("dm", "invited"));

    const result = await assertCampaignAccess("camp-1", "user-1");

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
  });

  it("returns 404 NextResponse when member status is 'declined'", async () => {
    mockedStorage.getMember.mockResolvedValue(makeMember("player", "declined"));

    const result = await assertCampaignAccess("camp-1", "user-1");

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
  });

  it("returns 404 NextResponse when active member but campaign document is missing", async () => {
    mockedStorage.getMember.mockResolvedValue(makeMember("dm", "active"));
    mockedStorage.loadCampaignByIdAny.mockResolvedValue(null);

    const result = await assertCampaignAccess("camp-1", "user-1");

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
    const body = await (result as NextResponse).json();
    expect(body).toEqual({ error: "Campaign not found" });
  });

  it("does not call loadCampaignByIdAny when member is not active", async () => {
    mockedStorage.getMember.mockResolvedValue(makeMember("dm", "invited"));

    await assertCampaignAccess("camp-1", "user-1");

    expect(mockedStorage.loadCampaignByIdAny).not.toHaveBeenCalled();
  });
});
