import fetch from "node-fetch";
import { startTestServer, registerAndGetCookie, TestServer } from "./helpers/server";

interface CampaignResponse {
  id: string;
  userId: string;
  name: string;
  moduleName: string;
  chapters: unknown[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: string;
}

describe("Campaign API Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;
  let authCookie: string;
  let authCookie2: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;

    const email1 = `campaign-test-${Date.now()}@example.com`;
    authCookie = await registerAndGetCookie(baseUrl, email1, "testPassword123!");

    const email2 = `campaign-user2-${Date.now()}@example.com`;
    authCookie2 = await registerAndGetCookie(baseUrl, email2, "testPassword123!");
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  function authed(cookie = authCookie) {
    return { "Content-Type": "application/json", Cookie: cookie };
  }

  async function createCampaign(name: string, cookie = authCookie): Promise<CampaignResponse> {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(cookie),
      body: JSON.stringify({ name }),
    });
    return res.json() as Promise<CampaignResponse>;
  }

  // --- GET /api/campaigns ---

  it("returns 401 for unauthenticated GET /api/campaigns", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`);
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty array when user has no campaigns", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, { headers: authed() });
    expect(res.status).toBe(200);
    const data = await res.json() as CampaignResponse[];
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("returns only the authenticated user's campaigns (user isolation)", async () => {
    await createCampaign("User1 Campaign");

    const res = await fetch(`${baseUrl}/api/campaigns`, { headers: authed(authCookie2) });
    const data = await res.json() as CampaignResponse[];
    expect(data.every(c => c.name !== "User1 Campaign")).toBe(true);
  });

  // --- POST /api/campaigns ---

  it("returns 401 for unauthenticated POST /api/campaigns", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ moduleName: "Strahd" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as ErrorResponse;
    expect(data.error).toBeTruthy();
  });

  it("returns 400 when name is blank/whitespace", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "   " }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 with all fields when full campaign is created", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Curse of Strahd",
        moduleName: "Curse of Strahd",
        active: true,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as CampaignResponse;
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("Curse of Strahd");
    expect(data.moduleName).toBe("Curse of Strahd");
    expect(data.chapters).toEqual([]);
    expect(data.active).toBe(true);
  });

  it("returns 201 with correct defaults when only name is provided", async () => {
    const data = await createCampaign("Minimal Campaign");
    expect(data.moduleName).toBe("");
    expect(data.chapters).toEqual([]);
    expect(data.active).toBe(false);
  });

  // --- GET /api/campaigns/[id] ---

  it("returns 401 for unauthenticated GET /api/campaigns/[id]", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/some-id`);
    expect(res.status).toBe(401);
  });

  it("returns 200 with campaign when it belongs to the authenticated user", async () => {
    const created = await createCampaign("Get By ID Test");

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, { headers: authed() });
    expect(res.status).toBe(200);
    const data = await res.json() as CampaignResponse;
    expect(data.id).toBe(created.id);
    expect(data.name).toBe("Get By ID Test");
  });

  it("returns 404 when campaign does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/nonexistent-id`, { headers: authed() });
    expect(res.status).toBe(404);
  });

  it("returns 404 when campaign exists but belongs to different user", async () => {
    const created = await createCampaign("User1 Private Campaign");

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, { headers: authed(authCookie2) });
    expect(res.status).toBe(404);
  });

  // --- PATCH /api/campaigns/[id] ---

  it("returns 401 for unauthenticated PATCH /api/campaigns/[id]", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/some-id`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 with updated campaign when single field is patched", async () => {
    const created = await createCampaign("Patch Test Campaign");

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, {
      method: "PATCH",
      headers: authed(),
      body: JSON.stringify({ name: "Updated Name" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as CampaignResponse;
    expect(data.name).toBe("Updated Name");
    expect(data.moduleName).toBe(created.moduleName);
    expect(data.active).toBe(created.active);
  });

  it("updates updatedAt on every PATCH", async () => {
    const created = await createCampaign("UpdatedAt Test");
    await new Promise(r => setTimeout(r, 10));

    const patchRes = await fetch(`${baseUrl}/api/campaigns/${created.id}`, {
      method: "PATCH",
      headers: authed(),
      body: JSON.stringify({ active: true }),
    });
    const patched = await patchRes.json() as CampaignResponse;
    expect(new Date(patched.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.updatedAt).getTime());
  });

  it("allows two campaigns to both have active: true simultaneously", async () => {
    const c1 = await (await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Active Campaign 1", active: true }),
    })).json() as CampaignResponse;

    const c2 = await (await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Active Campaign 2", active: true }),
    })).json() as CampaignResponse;

    expect(c1.active).toBe(true);
    expect(c2.active).toBe(true);
  });

  it("returns 404 when PATCHing a campaign that does not exist or belongs to another user", async () => {
    const created = await createCampaign("Patch 404 Test");

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, {
      method: "PATCH",
      headers: authed(authCookie2),
      body: JSON.stringify({ name: "Hijacked" }),
    });
    expect(res.status).toBe(404);
  });

  // --- DELETE /api/campaigns/[id] ---

  it("returns 401 for unauthenticated DELETE /api/campaigns/[id]", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/some-id`, { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 200/204 on successful delete", async () => {
    const created = await createCampaign("Delete Me");

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, {
      method: "DELETE",
      headers: authed(),
    });
    expect([200, 204]).toContain(res.status);
  });

  it("subsequent GET returns 404 after delete", async () => {
    const created = await createCampaign("Delete Then Get");

    await fetch(`${baseUrl}/api/campaigns/${created.id}`, {
      method: "DELETE",
      headers: authed(),
    });

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, { headers: authed() });
    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting a campaign that belongs to another user", async () => {
    const created = await createCampaign("Delete Auth Test");

    const res = await fetch(`${baseUrl}/api/campaigns/${created.id}`, {
      method: "DELETE",
      headers: authed(authCookie2),
    });
    expect(res.status).toBe(404);
  });

  // --- Party + Campaign association ---

  it("creating a party with valid campaignId persists and returns the campaignId", async () => {
    const campaign = await createCampaign("Party Association Campaign");

    const partyRes = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "The Fellowship", campaignId: campaign.id }),
    });
    expect(partyRes.status).toBe(201);
    const party = await partyRes.json() as { id: string; campaignId?: string };
    expect(party.campaignId).toBe(campaign.id);
  });

  it("creating a party without campaignId succeeds with no campaignId", async () => {
    const res = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "No Campaign Party" }),
    });
    expect(res.status).toBe(201);
    const party = await res.json() as { campaignId?: string };
    expect(party.campaignId).toBeUndefined();
  });

  it("deleting a campaign does not delete associated parties", async () => {
    const campaign = await createCampaign("Campaign To Delete");

    const partyRes = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Party With Campaign", campaignId: campaign.id }),
    });
    const party = await partyRes.json() as { id: string };

    await fetch(`${baseUrl}/api/campaigns/${campaign.id}`, {
      method: "DELETE",
      headers: authed(),
    });

    const getPartyRes = await fetch(`${baseUrl}/api/parties/${party.id}`, { headers: authed() });
    expect(getPartyRes.status).toBe(200);
  });
});
