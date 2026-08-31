import { MongoClient } from "mongodb";
import { registerTestUser, makeUserAdmin } from "./helpers/users";

interface TemplateResponse {
  id: string;
  userId: string;
  isGlobal: boolean;
  name: string;
  moduleName: string;
  chapters: unknown[];
  createdAt: string;
  updatedAt: string;
}

interface CampaignResponse {
  id: string;
  userId: string;
  name: string;
  moduleName: string;
  chapters: { id: string; title: string; order: number }[];
  currentChapterId?: string;
  templateId?: string;
  status: string;
  notes: string;
  encounterIds?: string[];
}

describe("Campaign Global API Integration Tests", () => {
  let baseUrl: string;
  let userCookie: string;
  let userId: string;
  let adminCookie: string;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    const user = await registerTestUser(baseUrl, "campaign-global-user");
    userCookie = user.cookie;
    userId = user.userId;

    const adminUser = await registerTestUser(baseUrl, "campaign-global-admin");
    adminCookie = adminUser.cookie;

    await makeUserAdmin(adminUser.userId);

    mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
  }, 30000);

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  function authedUser() { return { "Content-Type": "application/json", Cookie: userCookie }; }
  function authedAdmin() { return { "Content-Type": "application/json", Cookie: adminCookie }; }

  // --- GET /api/campaigns/global ---

  it("returns 200 with array (no auth required)", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`);
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns empty array when no templates exist", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`);
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(data).toHaveLength(0);
  });

  // --- POST /api/campaigns/global ---

  it("returns 403 for non-admin POST", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedUser(),
      body: JSON.stringify({ name: "Test Template" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 401 for unauthenticated POST", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Template" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({ moduleName: "Test" }),
    });
    expect(res.status).toBe(400);
  });

  it("admin creates template with empty chapters and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({ name: "Lost Mine", moduleName: "LMoP", chapters: [] }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as TemplateResponse;
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("Lost Mine");
    expect(data.isGlobal).toBe(true);
    expect(data.chapters).toEqual([]);
  });

  // --- PUT /api/campaigns/global ---

  it("returns 501 for admin PUT (seed stub)", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "PUT",
      headers: authedAdmin(),
    });
    expect(res.status).toBe(501);
  });

  it("returns 403 for non-admin PUT", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "PUT",
      headers: authedUser(),
    });
    expect(res.status).toBe(403);
  });

  // --- DELETE /api/campaigns/global/[id] ---

  it("returns 403 for non-admin DELETE", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global/some-id`, {
      method: "DELETE",
      headers: authedUser(),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when deleting non-existent template", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global/nonexistent-id`, {
      method: "DELETE",
      headers: authedAdmin(),
    });
    expect(res.status).toBe(404);
  });

  it("admin deletes existing template and it no longer appears in GET", async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({ name: "To Delete" }),
    });
    const created = await createRes.json() as TemplateResponse;

    const deleteRes = await fetch(`${baseUrl}/api/campaigns/global/${created.id}`, {
      method: "DELETE",
      headers: authedAdmin(),
    });
    expect(deleteRes.status).toBe(200);

    const getRes = await fetch(`${baseUrl}/api/campaigns/global`);
    const templates = await getRes.json() as TemplateResponse[];
    expect(templates.find((t) => t.id === created.id)).toBeUndefined();
  });

  // --- POST /api/campaigns/global/[id]/copy ---

  it("returns 401 for unauthenticated copy", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global/some-id/copy`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when copying non-existent template", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/global/nonexistent-id/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    expect(res.status).toBe(404);
  });

  it("authenticated user copies template and gets new campaign", async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({
        name: "Strahd",
        moduleName: "CoS",
        chapters: [
          { id: "orig-ch-1", title: "Into Barovia", order: 0 },
          { id: "orig-ch-2", title: "The Village", order: 1 },
        ],
      }),
    });
    const template = await createRes.json() as TemplateResponse;

    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${template.id}/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    expect(copyRes.status).toBe(201);
    const campaign = await copyRes.json() as CampaignResponse;

    expect(campaign.id).toBeTruthy();
    expect(campaign.name).toBe("Strahd");
    expect(campaign.moduleName).toBe("CoS");
    expect(campaign.templateId).toBe(template.id);
    expect(campaign.chapters).toHaveLength(2);
    expect(campaign.currentChapterId).toBe(campaign.chapters[0].id);
    expect(campaign.chapters[0].id).not.toBe("orig-ch-1");
    expect(campaign.chapters[1].id).not.toBe("orig-ch-2");
    expect(campaign.status).toBe("planning");
  });

  it("chapter ids are new UUIDs distinct from template chapter ids", async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({
        name: "UUID Test",
        chapters: [{ id: "template-ch-uuid", title: "Start", order: 0 }],
      }),
    });
    const template = await createRes.json() as TemplateResponse;

    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${template.id}/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    const campaign = await copyRes.json() as CampaignResponse;
    expect(campaign.chapters[0].id).not.toBe("template-ch-uuid");
    expect(campaign.chapters[0].id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("template with empty chapters yields campaign with empty chapters and no currentChapterId", async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({ name: "Empty Chapters", chapters: [] }),
    });
    const template = await createRes.json() as TemplateResponse;

    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${template.id}/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    const campaign = await copyRes.json() as CampaignResponse;
    expect(campaign.chapters).toEqual([]);
    expect(campaign.currentChapterId).toBeUndefined();
  });

  it("same template can be copied twice to get two distinct campaigns", async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({ name: "Double Copy" }),
    });
    const template = await createRes.json() as TemplateResponse;

    const [copy1Res, copy2Res] = await Promise.all([
      fetch(`${baseUrl}/api/campaigns/global/${template.id}/copy`, { method: "POST", headers: authedUser() }),
      fetch(`${baseUrl}/api/campaigns/global/${template.id}/copy`, { method: "POST", headers: authedUser() }),
    ]);
    const copy1 = await copy1Res.json() as CampaignResponse;
    const copy2 = await copy2Res.json() as CampaignResponse;
    expect(copy1.id).not.toBe(copy2.id);
  });

  it("persists a campaignMembers record with role dm and status active after copy", async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/global`, {
      method: "POST",
      headers: authedAdmin(),
      body: JSON.stringify({ name: "Member Test" }),
    });
    const template = await createRes.json() as TemplateResponse;

    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${template.id}/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    const campaign = await copyRes.json() as CampaignResponse;

    const db = mongoClient.db(process.env.MONGODB_DB!);
    const member = await db.collection("campaignMembers").findOne({
      campaignId: { $eq: campaign.id },
    });

    expect(member).not.toBeNull();
    expect(member!.userId).toBe(userId);
    expect(member!.role).toBe("dm");
    expect(member!.status).toBe("active");
  });

  it("copies a campaign template that contains encounters, ensuring new Encounter objects are created and linked", async () => {
    const db = mongoClient.db(process.env.MONGODB_DB!);
    const tplId = "tpl-enc-" + Date.now();
    await db.collection("campaignTemplates").insertOne({
      id: tplId,
      userId: "GLOBAL",
      isGlobal: true,
      name: "With Encounters",
      moduleName: "WE",
      chapters: [],
      encounters: [
        { name: "Encounter 1", description: "Desc 1", monsters: [] },
        { name: "Encounter 2", description: "Desc 2", monsters: [] }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${tplId}/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    expect(copyRes.status).toBe(201);
    const campaign = await copyRes.json() as CampaignResponse;
    
    expect(campaign.encounterIds).toBeDefined();
    expect(campaign.encounterIds?.length).toBe(2);

    const encountersCount = await db.collection("encounters").countDocuments({
      id: { $in: campaign.encounterIds }
    });
    expect(encountersCount).toBe(2);
    
    // cleanup
    await db.collection("campaignTemplates").deleteOne({ id: tplId });
    await db.collection("campaigns").deleteOne({ id: campaign.id });
    await db.collection("encounters").deleteMany({ id: { $in: campaign.encounterIds! } });
  });

  it("rolls back campaign creation if encounter DB insertion fails", async () => {
    const db = mongoClient.db(process.env.MONGODB_DB!);
    const tplId = "tpl-enc-fail-" + Date.now();
    
    await db.collection("campaignTemplates").insertOne({
      id: tplId,
      userId: "GLOBAL",
      isGlobal: true,
      name: "Fail Template",
      moduleName: "FT",
      chapters: [],
      encounters: [
        { name: "Giant Encounter", description: "This will fail due to validator", monsters: [] }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create encounters collection with a strict validator that forces failure
    try {
      await db.createCollection("encounters");
    } catch (e) {
      // Ignore if exists
    }
    await db.command({
      collMod: "encounters",
      validator: { $jsonSchema: { required: ["impossible_field"] } }
    });

    const copyRes = await fetch(`${baseUrl}/api/campaigns/global/${tplId}/copy`, {
      method: "POST",
      headers: authedUser(),
    });
    
    // Should fail with 500 because the BSON insert will throw
    expect(copyRes.status).toBe(500);
    
    // Verify rollback: Campaign should not exist
    const campaignMatch = await db.collection("campaigns").findOne({ templateId: tplId });
    expect(campaignMatch).toBeNull();

    const encountersCount = await db.collection("encounters").countDocuments({ name: "Giant Encounter" });
    expect(encountersCount).toBe(0);

    // cleanup
    await db.collection("campaignTemplates").deleteOne({ id: tplId });
    // remove validator
    await db.command({ collMod: "encounters", validator: {} });
  });
});
