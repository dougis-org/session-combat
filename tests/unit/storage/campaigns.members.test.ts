/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { DuplicateMemberError } from "@/lib/errors";
import { MEMBER_ROLES, MemberRole, CampaignMember } from "@/lib/types";
import { POST } from "@/app/api/campaigns/route";
import { makeRouteRequest } from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) => (req: NextRequest) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }),
  withAuthAndParams: (handler: Function) => async (req: NextRequest, ctx: any) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }, await ctx.params),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

function makeMockCollection() {
  const toArray = jest.fn<Promise<unknown[]>, []>();
  const find = jest.fn(() => ({ toArray }));
  const findOne = jest.fn<Promise<unknown>, []>();
  const updateOne = jest.fn<Promise<unknown>, []>();
  const insertOne = jest.fn<Promise<unknown>, []>();
  const deleteOne = jest.fn<Promise<unknown>, []>();
  return { find, toArray, findOne, updateOne, insertOne, deleteOne };
}

describe("Campaign members storage and types", () => {
  describe("Types and errors", () => {
    test("MEMBER_ROLES contains exactly ['dm', 'player']", () => {
      expect(MEMBER_ROLES).toEqual(["dm", "player"]);
    });

    test("CampaignMember type check compiles", () => {
      const member: CampaignMember = {
        id: "member-1",
        campaignId: "campaign-1",
        userId: "user-1",
        role: "player",
        status: "invited",
        history: [{ action: "invited", by: "user-dm", at: new Date("2026-05-30T12:00:00Z") }],
      };
      expect(member.role).toBe("player");
    });

    test("DuplicateMemberError properties", () => {
      const err = new DuplicateMemberError("camp-123", "user-456");
      expect(err.name).toBe("DuplicateMemberError");
      expect(err.message).toContain("camp-123");
      expect(err.message).toContain("user-456");
      expect(err instanceof Error).toBe(true);
    });
  });

  describe("addMember (mocked DB)", () => {
    let mockCollection: ReturnType<typeof makeMockCollection>;
    let mockDb: { collection: ReturnType<typeof jest.fn> };

    beforeEach(() => {
      mockCollection = makeMockCollection();
      mockDb = { collection: jest.fn(() => mockCollection) };
      mockedGetDatabase.mockResolvedValue(mockDb as never);
    });

    test("happy path — resolves when insert succeeds", async () => {
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true } as never);
      const member: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "dm",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };
      await expect(storage.addMember(member)).resolves.not.toThrow();
      expect(mockDb.collection).toHaveBeenCalledWith("campaignMembers");
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mem-1",
          campaignId: "camp-1",
          userId: "user-1",
          role: "dm",
          status: "active",
        })
      );
    });

    test("duplicate — throws DuplicateMemberError on mongo code 11000", async () => {
      mockCollection.insertOne.mockRejectedValue({ code: 11000 } as never);
      const member: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "dm",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };
      await expect(storage.addMember(member)).rejects.toThrow(DuplicateMemberError);
    });

    test("other DB error — throws original error", async () => {
      mockCollection.insertOne.mockRejectedValue(new Error("DB failure") as never);
      const member: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "dm",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };
      await expect(storage.addMember(member)).rejects.toThrow("DB failure");
    });
  });

  describe("updateMemberStatus (mocked DB)", () => {
    let mockCollection: ReturnType<typeof makeMockCollection>;
    let mockDb: { collection: ReturnType<typeof jest.fn> };

    beforeEach(() => {
      mockCollection = makeMockCollection();
      mockDb = { collection: jest.fn(() => mockCollection) };
      mockedGetDatabase.mockResolvedValue(mockDb as never);
    });

    test("status field updated to new value", async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 } as never);
      await storage.updateMemberStatus("camp-1", "user-1", "invited", "dm-user");
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { campaignId: "camp-1", userId: "user-1" },
        expect.objectContaining({ $set: { status: "invited" } })
      );
    });

    test("history entry appended with correct action, by, at", async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 } as never);
      await storage.updateMemberStatus("camp-1", "user-1", "invited", "dm-user");
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { campaignId: "camp-1", userId: "user-1" },
        expect.objectContaining({
          $push: expect.objectContaining({
            history: expect.objectContaining({ action: "invited", by: "dm-user", at: expect.any(Date) }),
          }),
        })
      );
    });

    test("member not found — no error thrown, no document modified", async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 } as never);
      await expect(
        storage.updateMemberStatus("camp-1", "nobody", "invited", "dm-user")
      ).resolves.not.toThrow();
    });

    test("DB error — rethrows", async () => {
      mockCollection.updateOne.mockRejectedValue(new Error("DB failure") as never);
      await expect(
        storage.updateMemberStatus("camp-1", "user-1", "invited", "dm-user")
      ).rejects.toThrow("DB failure");
    });

    test("role reset — includes role in $set when provided", async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 } as never);
      await storage.updateMemberStatus("camp-1", "user-1", "invited", "dm-user", "player");
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { campaignId: "camp-1", userId: "user-1" },
        expect.objectContaining({ $set: { status: "invited", role: "player" } })
      );
    });
  });

  describe("listMembersForCampaign (mocked DB)", () => {
    let mockCollection: ReturnType<typeof makeMockCollection>;
    let mockDb: { collection: ReturnType<typeof jest.fn> };

    beforeEach(() => {
      mockCollection = makeMockCollection();
      mockDb = { collection: jest.fn(() => mockCollection) };
      mockedGetDatabase.mockResolvedValue(mockDb as never);
    });

    test("returns normalized members for campaign", async () => {
      const rawDbMembers = [
        { _id: "obj-1", id: "mem-1", campaignId: "camp-1", userId: "user-1", role: "dm", status: "active" },
        { _id: "obj-2", id: "mem-2", campaignId: "camp-1", userId: "user-2", role: "player", status: "invited" },
      ];
      mockCollection.toArray.mockResolvedValue(rawDbMembers);

      const result = await storage.listMembersForCampaign("camp-1");
      expect(mockCollection.find).toHaveBeenCalledWith({ campaignId: "camp-1" });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("mem-1");
      expect(result[0]).not.toHaveProperty("_id");
      expect(result[1].id).toBe("mem-2");
      expect(result[1]).not.toHaveProperty("_id");
    });

    test("returns empty array when no members", async () => {
      mockCollection.toArray.mockResolvedValue([]);
      const result = await storage.listMembersForCampaign("camp-1");
      expect(result).toEqual([]);
    });
  });

  describe("listCampaignsForMember (mocked DB)", () => {
    let mockCollection: ReturnType<typeof makeMockCollection>;
    let mockDb: { collection: ReturnType<typeof jest.fn> };

    beforeEach(() => {
      mockCollection = makeMockCollection();
      mockDb = { collection: jest.fn(() => mockCollection) };
      mockedGetDatabase.mockResolvedValue(mockDb as never);
    });

    test("returns CampaignMemberSummary[] when user has memberships", async () => {
      const rawMemberships = [
        { id: "m-1", campaignId: "camp-1", userId: "user-1" },
        { id: "m-2", campaignId: "camp-2", userId: "user-1" },
      ];
      mockCollection.toArray.mockResolvedValueOnce(rawMemberships);

      const mockCampaigns = [
        { id: "camp-1", name: "Campaign One" },
        { id: "camp-2", name: "Campaign Two" },
      ];
      mockCollection.toArray.mockResolvedValueOnce(mockCampaigns);

      const result = await storage.listCampaignsForMember("user-1");
      expect(mockDb.collection).toHaveBeenCalledWith("campaignMembers");
      expect(mockCollection.find).toHaveBeenNthCalledWith(1, { userId: "user-1" });

      expect(mockDb.collection).toHaveBeenCalledWith("campaigns");
      expect(mockCollection.find).toHaveBeenNthCalledWith(
        2,
        { id: { $in: ["camp-1", "camp-2"] } },
        { projection: { id: 1, name: 1 } }
      );

      expect(result).toEqual([
        { id: "camp-1", name: "Campaign One" },
        { id: "camp-2", name: "Campaign Two" },
      ]);
    });

    test("returns [] without querying campaigns when user has no memberships", async () => {
      mockCollection.toArray.mockResolvedValueOnce([]);
      const result = await storage.listCampaignsForMember("user-1");
      expect(result).toEqual([]);
      expect(mockDb.collection).not.toHaveBeenCalledWith("campaigns");
    });
  });
});

describe("Route POST seeding (mocked storage)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST campaign — 201 returned and addMember called with correct DM payload", async () => {
    const saveCampaignSpy = jest.spyOn(storage, "saveCampaign").mockResolvedValue(undefined as any);
    const addMemberSpy = jest.spyOn(storage, "addMember").mockResolvedValue(undefined as any);
    const req = makeRouteRequest("http://localhost/api/campaigns", "POST", { name: "New Epic Campaign" });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("New Epic Campaign");

    expect(saveCampaignSpy).toHaveBeenCalled();
    expect(addMemberSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: body.id,
        userId: "user-123",
        role: "dm",
        status: "active",
        history: expect.arrayContaining([
          expect.objectContaining({ action: "active", by: "user-123" }),
        ]),
      })
    );

    saveCampaignSpy.mockRestore();
    addMemberSpy.mockRestore();
  });

  test("POST campaign — deleteCampaign called and 500 returned when addMember throws", async () => {
    const saveCampaignSpy = jest.spyOn(storage, "saveCampaign").mockResolvedValue(undefined as any);
    const addMemberSpy = jest.spyOn(storage, "addMember").mockRejectedValue(new Error("DB failure") as never);
    const deleteCampaignSpy = jest.spyOn(storage, "deleteCampaign").mockResolvedValue(undefined as any);

    const req = makeRouteRequest("http://localhost/api/campaigns", "POST", { name: "Failed Seeding Campaign" });
    const response = await POST(req);

    expect(response.status).toBe(500);

    expect(saveCampaignSpy).toHaveBeenCalled();
    expect(addMemberSpy).toHaveBeenCalled();
    expect(deleteCampaignSpy).toHaveBeenCalledWith(
      expect.any(String),
      "user-123"
    );

    saveCampaignSpy.mockRestore();
    addMemberSpy.mockRestore();
    deleteCampaignSpy.mockRestore();
  });
});
