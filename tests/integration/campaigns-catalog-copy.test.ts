import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import { registerTestUser, makeUserAdmin } from "./helpers/users";

interface TemplateResponse {
  id: string;
  name: string;
  moduleName: string;
  chapters: { id: string; title: string; order: number }[];
}

interface CampaignResponse {
  id: string;
  userId: string;
  name: string;
  status: string;
  chapters: { id: string; title: string; order: number }[];
}

describe("Campaign Catalog Copy Integration Tests", () => {
  let baseUrl: string;
  let userCookie: string;
  let userId: string;
  let adminCookie: string;
  let mongoClient: MongoClient;
  let templateId: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    const user = await registerTestUser(baseUrl, "catalog-copy-user");
    userCookie = user.cookie;
    userId = user.userId;

    const admin = await registerTestUser(baseUrl, "catalog-copy-admin");
    adminCookie = admin.cookie;
    await makeUserAdmin(admin.userId);

    mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();

    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Lost Mine of Phandelver",
        moduleName: "LMoP",
        chapters: [
          { id: "orig-ch-1", title: "Goblin Arrows", order: 0 },
          { id: "orig-ch-2", title: "Phandalin", order: 1 },
        ],
      }),
    });
    expect(createRes.status).toBe(201);
    const template = await createRes.json() as TemplateResponse;
    templateId = template.id;
  }, 30000);

  afterAll(async () => {
    const db = mongoClient.db(process.env.MONGODB_DB!);
    await db.collection("campaigns").deleteMany({ templateId });
    await db.collection("campaignMembers").deleteMany({ userId });
    await db.collection("campaignTemplates").deleteMany({ id: templateId });
    await mongoClient.close();
  });

  it("returns 201 and campaign accessible via GET after copy", async () => {
    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${templateId}/copy`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    expect(copyRes.status).toBe(201);
    const campaign = await copyRes.json() as CampaignResponse;
    expect(campaign.id).toBeTruthy();
    expect(campaign.name).toBe("Lost Mine of Phandelver");

    const getRes = await fetch(`${baseUrl}/api/campaigns/${campaign.id}`, {
      headers: { Cookie: userCookie },
    });
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json() as CampaignResponse;
    expect(fetched.name).toBe("Lost Mine of Phandelver");
  });

  it("persists a campaignMembers record with role dm and status active after copy", async () => {
    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${templateId}/copy`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    expect(copyRes.status).toBe(201);
    const campaign = await copyRes.json() as CampaignResponse;

    const db = mongoClient.db(process.env.MONGODB_DB!);
    const member = await db.collection("campaignMembers").findOne({
      campaignId: campaign.id,
    });

    expect(member).not.toBeNull();
    expect(member!.userId).toBe(userId);
    expect(member!.role).toBe("dm");
    expect(member!.status).toBe("active");
  });

  it("returns 404 when copying a non-existent template", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global/nonexistent-id/copy`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(404);
  });

  it("returns 401 for unauthenticated copy", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global/${templateId}/copy`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });
});
