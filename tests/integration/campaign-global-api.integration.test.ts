import fetch from "node-fetch";
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
}

describe("Campaign Global API Integration Tests", () => {
  let baseUrl: string;
  let userCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    userCookie = (await registerTestUser(baseUrl, "campaign-global-user")).cookie;

    const adminUser = await registerTestUser(baseUrl, "campaign-global-admin");
    adminCookie = adminUser.cookie;

    await makeUserAdmin(adminUser.userId);
  }, 30000);

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
});
