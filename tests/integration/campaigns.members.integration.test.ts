import fetch from "node-fetch";
import { storage } from "@/lib/storage";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { DuplicateMemberError } from "@/lib/errors";
import { CampaignMember, Campaign } from "@/lib/types";
import { registerTestUser } from "./helpers/users";

describe("Campaign Members Integration Tests", () => {
  let baseUrl: string;
  let authCookie: string;
  let apiUserId: string;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");

    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    await connectToDatabase();

    const testUser = await registerTestUser(baseUrl, "members-integration-test");
    authCookie = testUser.cookie;
    apiUserId = testUser.userId;
  }, 30000);

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    const db = await getDatabase();
    // Only delete members with the fake "camp-*" IDs used in this test file.
    // Real campaign IDs are UUIDs and must not be wiped — parallel test files
    // depend on member records created during campaign creation.
    await db.collection("campaignMembers").deleteMany({ campaignId: { $regex: "^camp-" } });
  });

  describe("Storage Methods Integration", () => {
    test("addMember — inserts and listMembersForCampaign returns it", async () => {
      const member: CampaignMember = {
        id: "mem-123",
        campaignId: "camp-123",
        userId: "user-456",
        role: "player",
        status: "invited",
        history: [{ action: "invited", by: "user-dm", at: new Date() }],
      };

      await storage.addMember(member);

      const list = await storage.listMembersForCampaign("camp-123");
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("mem-123");
      expect(list[0].userId).toBe("user-456");
      expect(list[0].role).toBe("player");
      expect(list[0].status).toBe("invited");
    });

    test("addMember — duplicate throws DuplicateMemberError", async () => {
      const member: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "dm",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };

      await storage.addMember(member);

      // Attempt duplicate
      await expect(storage.addMember(member)).rejects.toThrow(DuplicateMemberError);
    });

    test("addMember — same user, different campaign: both succeed", async () => {
      const member1: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "dm",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };

      const member2: CampaignMember = {
        id: "mem-2",
        campaignId: "camp-2",
        userId: "user-1",
        role: "player",
        status: "invited",
        history: [{ action: "invited", by: "user-dm", at: new Date() }],
      };

      await storage.addMember(member1);
      await expect(storage.addMember(member2)).resolves.not.toThrow();

      const list1 = await storage.listMembersForCampaign("camp-1");
      const list2 = await storage.listMembersForCampaign("camp-2");
      expect(list1).toHaveLength(1);
      expect(list2).toHaveLength(1);
    });

    test("updateMemberStatus — status update persisted", async () => {
      const member: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "player",
        status: "invited",
        history: [{ action: "invited", by: "user-dm", at: new Date() }],
      };

      await storage.addMember(member);
      await storage.updateMemberStatus("camp-1", "user-1", "active", "user-dm");

      const list = await storage.listMembersForCampaign("camp-1");
      expect(list[0].status).toBe("active");
      expect(list[0].role).toBe("player");
    });

    test("updateMemberStatus — history entry appended", async () => {
      const member: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-1",
        userId: "user-1",
        role: "player",
        status: "invited",
        history: [{ action: "invited", by: "user-dm", at: new Date() }],
      };

      await storage.addMember(member);
      await storage.updateMemberStatus("camp-1", "user-1", "active", "user-dm");

      const list = await storage.listMembersForCampaign("camp-1");
      expect(list[0].history).toHaveLength(2);
      expect(list[0].history[1].action).toBe("active");
      expect(list[0].history[1].by).toBe("user-dm");
    });

    test("updateMemberStatus — non-existent member: no error, no record created", async () => {
      await expect(storage.updateMemberStatus("camp-none", "user-none", "invited", "user-dm")).resolves.not.toThrow();
      const list = await storage.listMembersForCampaign("camp-none");
      expect(list).toHaveLength(0);
    });

    test("listMembersForCampaign — returns correct members for campaign", async () => {
      const member1: CampaignMember = {
        id: "mem-1",
        campaignId: "camp-abc",
        userId: "user-1",
        role: "dm",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };

      const member2: CampaignMember = {
        id: "mem-2",
        campaignId: "camp-abc",
        userId: "user-2",
        role: "player",
        status: "active",
        history: [{ action: "active", by: "user-1", at: new Date() }],
      };

      const member3: CampaignMember = {
        id: "mem-3",
        campaignId: "camp-other",
        userId: "user-3",
        role: "player",
        status: "active",
        history: [{ action: "active", by: "user-dm", at: new Date() }],
      };

      await storage.addMember(member1);
      await storage.addMember(member2);
      await storage.addMember(member3);

      const list = await storage.listMembersForCampaign("camp-abc");
      expect(list).toHaveLength(2);
      const ids = list.map(m => m.id).sort();
      expect(ids).toEqual(["mem-1", "mem-2"]);
    });

    test("listMembersForCampaign — returns empty for unknown campaign", async () => {
      const list = await storage.listMembersForCampaign("camp-unknown");
      expect(list).toEqual([]);
    });

    describe("listCampaignsForMember", () => {
      const TEST_CAMPAIGN_IDS = ["camp-1", "camp-2", "camp-3"];

      afterEach(async () => {
        const db = await getDatabase();
        await db.collection("campaigns").deleteMany({ id: { $in: TEST_CAMPAIGN_IDS } });
      });

      test("returns correct { id, name } for each campaign", async () => {
        const db = await getDatabase();

        const campaign1: Campaign = {
          id: "camp-1",
          userId: "user-dm",
          name: "Lost Mine",
          moduleName: "LMoP",
          chapters: [],
          partyIds: [],
          status: "active",
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const campaign2: Campaign = {
          id: "camp-2",
          userId: "user-dm",
          name: "Dragon Heist",
          moduleName: "DH",
          chapters: [],
          partyIds: [],
          status: "active",
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const campaign3: Campaign = {
          id: "camp-3",
          userId: "user-dm",
          name: "Out of the Abyss",
          moduleName: "OotA",
          chapters: [],
          partyIds: [],
          status: "active",
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection<Campaign>("campaigns").insertMany([campaign1, campaign2, campaign3]);

        const member1: CampaignMember = {
          id: "mem-1",
          campaignId: "camp-1",
          userId: "user-alice",
          role: "player",
          status: "active",
          history: [{ action: "active", by: "user-dm", at: new Date() }],
        };

        const member2: CampaignMember = {
          id: "mem-2",
          campaignId: "camp-3",
          userId: "user-alice",
          role: "player",
          status: "invited",
          history: [{ action: "invited", by: "user-dm", at: new Date() }],
        };

        await storage.addMember(member1);
        await storage.addMember(member2);

        const list = await storage.listCampaignsForMember("user-alice");
        expect(list).toHaveLength(2);
        const sorted = list.sort((a, b) => a.id.localeCompare(b.id));
        expect(sorted).toEqual([
          { id: "camp-1", name: "Lost Mine" },
          { id: "camp-3", name: "Out of the Abyss" },
        ]);
      });

      test("returns empty for user with no memberships", async () => {
        const list = await storage.listCampaignsForMember("user-none");
        expect(list).toEqual([]);
      });
    });
  });

  describe("API POST Seeding Integration", () => {
    let createdCampaignId: string | null = null;

    afterEach(async () => {
      if (createdCampaignId) {
        const db = await getDatabase();
        await db.collection("campaigns").deleteMany({ id: createdCampaignId });
        createdCampaignId = null;
      }
    });

    test("POST /api/campaigns — response is 201 and campaign owner seeded as active DM", async () => {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({ name: "Seeded Campaign" }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.id).toBeDefined();
      expect(body.name).toBe("Seeded Campaign");

      createdCampaignId = body.id;

      const db = await getDatabase();
      const members = await db
        .collection("campaignMembers")
        .find({ campaignId: body.id })
        .toArray();

      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(apiUserId);
      expect(members[0].role).toBe("dm");
      expect(members[0].status).toBe("active");
    });
  });

  describe("PUT /api/campaigns/[id]/members/[userId]/parties/[partyId]", () => {
    let testCampaignId: string;
    let otherUserId: string;

    afterEach(async () => {
      const db = await getDatabase();
      await db.collection("campaigns").deleteMany({ id: testCampaignId });
      await db.collection("campaignMembers").deleteMany({ campaignId: testCampaignId });
      await db.collection("parties").deleteMany({ campaignId: testCampaignId });
      await db.collection("characters").deleteMany({ userId: otherUserId });
    });

    beforeEach(async () => {
      testCampaignId = "camp-party-" + Date.now();
      otherUserId = "user-party-" + Date.now();
      
      const db = await getDatabase();
      await db.collection("campaigns").insertOne({
        id: testCampaignId,
        name: "Test Campaign",
        userId: apiUserId,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await storage.addMember({
        id: "mem-dm-" + Date.now(),
        campaignId: testCampaignId,
        userId: apiUserId,
        role: "dm",
        status: "active",
        history: []
      });

      await storage.addMember({
        id: "mem-player-" + Date.now(),
        campaignId: testCampaignId,
        userId: otherUserId,
        role: "player",
        status: "active",
        history: []
      });
      
      await storage.saveParty({
        id: "party-1",
        userId: otherUserId,
        campaignId: testCampaignId,
        name: "Test Party",
        members: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await storage.saveCharacter({
        id: "char-1",
        userId: otherUserId,
        name: "Test Char",
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 1,
        stats: { hp: 10, maxHp: 10, tempHp: 0, ac: 10, speed: 30, passivePerception: 10 },
        isPublic: true
      } as any);
    });

    test("returns 400 if characterIds is not an array", async () => {
      const res = await fetch(`${baseUrl}/api/campaigns/${testCampaignId}/members/${otherUserId}/parties/party-1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: authCookie },
        body: JSON.stringify({ characterIds: "not-an-array" }),
      });
      expect(res.status).toBe(400);
    });

    test("updates party successfully for active member", async () => {
      const res = await fetch(`${baseUrl}/api/campaigns/${testCampaignId}/members/${otherUserId}/parties/party-1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: authCookie },
        body: JSON.stringify({ characterIds: ["char-1"] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.members).toHaveLength(1);
      expect(data.members[0].characterId).toBe("char-1");
    });
  });
});
