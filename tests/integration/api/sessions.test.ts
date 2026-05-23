import fetch from "node-fetch";
import { startTestServer, registerAndGetCookie, TestServer } from "../helpers/server";

interface SessionLogResponse {
  id: string;
  userId: string;
  campaignId: string;
  sessionNumber: number;
  title?: string;
  datePlayed: string;
  summary?: string;
  events: unknown[];
  milestone: boolean;
  newLevel?: number;
  createdAt: string;
  updatedAt: string;
}

describe("Session Log API Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;
  let authCookie: string;
  let authCookie2: string;
  let campaignId: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;

    const email1 = `sessions-user1-${Date.now()}@example.com`;
    authCookie = await registerAndGetCookie(baseUrl, email1, "TestPassword123!");

    const email2 = `sessions-user2-${Date.now()}@example.com`;
    authCookie2 = await registerAndGetCookie(baseUrl, email2, "TestPassword123!");

    // Create a campaign for user1
    const campRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: authCookie },
      body: JSON.stringify({ name: "Session Test Campaign" }),
    });
    const camp = await campRes.json() as { id: string };
    campaignId = camp.id;
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  function authed(cookie = authCookie) {
    return { "Content-Type": "application/json", Cookie: cookie };
  }

  async function createSession(
    overrides: Record<string, unknown> = {},
    cookie = authCookie
  ): Promise<SessionLogResponse> {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`, {
      method: "POST",
      headers: authed(cookie),
      body: JSON.stringify({ datePlayed: "2026-05-01", ...overrides }),
    });
    return res.json() as Promise<SessionLogResponse>;
  }

  // --- Auth ---

  it("returns 401 for unauthenticated GET /api/campaigns/[id]/sessions", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`);
    expect(res.status).toBe(401);
  });

  it("returns 401 for unauthenticated POST /api/campaigns/[id]/sessions", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datePlayed: "2026-05-01" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for unauthenticated PATCH /api/campaigns/[id]/sessions/[sessionId]", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/fake-id`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for unauthenticated DELETE /api/campaigns/[id]/sessions/[sessionId]", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/fake-id`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  // --- GET ---

  it("returns empty array when campaign has no sessions", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`, {
      headers: authed(),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as SessionLogResponse[];
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  // --- POST ---

  it("returns 400 when datePlayed is missing", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ summary: "No date" }),
    });
    expect(res.status).toBe(400);
  });

  it("creates session log with all fields and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        datePlayed: "2026-05-01",
        sessionNumber: 5,
        title: "The Siege",
        summary: "Epic battle",
        events: [],
        milestone: true,
        newLevel: 7,
      }),
    });
    expect(res.status).toBe(201);
    const log = await res.json() as SessionLogResponse;
    expect(log.id).toBeTruthy();
    expect(log.sessionNumber).toBe(5);
    expect(log.title).toBe("The Siege");
    expect(log.milestone).toBe(true);
    expect(log.newLevel).toBe(7);
  });

  it("auto-increments sessionNumber when not provided", async () => {
    // Create a session with number 10 first
    await createSession({ sessionNumber: 10 });
    const log = await createSession({});
    expect(log.sessionNumber).toBeGreaterThan(0);
  });

  it("defaults milestone to false when not provided", async () => {
    const log = await createSession({ datePlayed: "2026-05-02" });
    expect(log.milestone).toBe(false);
  });

  // --- GET sorted ---

  it("returns sessions sorted by sessionNumber descending", async () => {
    // Create a new campaign for isolation
    const campRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Sort Test Campaign" }),
    });
    const camp = await campRes.json() as { id: string };
    const cid = camp.id;

    await fetch(`${baseUrl}/api/campaigns/${cid}/sessions`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ datePlayed: "2026-01-01", sessionNumber: 1 }),
    });
    await fetch(`${baseUrl}/api/campaigns/${cid}/sessions`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ datePlayed: "2026-01-03", sessionNumber: 3 }),
    });
    await fetch(`${baseUrl}/api/campaigns/${cid}/sessions`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ datePlayed: "2026-01-02", sessionNumber: 2 }),
    });

    const res = await fetch(`${baseUrl}/api/campaigns/${cid}/sessions`, {
      headers: authed(),
    });
    expect(res.status).toBe(200);
    const logs = await res.json() as SessionLogResponse[];
    expect(logs).toHaveLength(3);
    expect(logs[0].sessionNumber).toBe(3);
    expect(logs[1].sessionNumber).toBe(2);
    expect(logs[2].sessionNumber).toBe(1);
  });

  // --- PATCH ---

  it("PATCH updates specified fields and returns updated document", async () => {
    const log = await createSession({ title: "Original Title", sessionNumber: 20 });

    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/${log.id}`, {
      method: "PATCH",
      headers: authed(),
      body: JSON.stringify({ title: "New Title" }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json() as SessionLogResponse;
    expect(updated.title).toBe("New Title");
    expect(updated.sessionNumber).toBe(20);
  });

  it("PATCH returns 404 for non-existent session", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/nonexistent-id`, {
      method: "PATCH",
      headers: authed(),
      body: JSON.stringify({ title: "X" }),
    });
    expect(res.status).toBe(404);
  });

  // --- DELETE ---

  it("DELETE removes the session; subsequent GET list does not include it", async () => {
    const campRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Delete Test Campaign" }),
    });
    const camp = await campRes.json() as { id: string };
    const cid = camp.id;

    const createRes = await fetch(`${baseUrl}/api/campaigns/${cid}/sessions`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ datePlayed: "2026-05-10", sessionNumber: 1 }),
    });
    const log = await createRes.json() as SessionLogResponse;

    const delRes = await fetch(`${baseUrl}/api/campaigns/${cid}/sessions/${log.id}`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(delRes.status).toBe(200);

    const listRes = await fetch(`${baseUrl}/api/campaigns/${cid}/sessions`, {
      headers: authed(),
    });
    const remaining = await listRes.json() as SessionLogResponse[];
    expect(remaining.find(l => l.id === log.id)).toBeUndefined();
  });

  it("DELETE returns 404 for non-existent session", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/nonexistent-id`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(res.status).toBe(404);
  });

  // --- User isolation ---

  it("user B cannot read user A's session logs (404 on campaign)", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions`, {
      headers: authed(authCookie2),
    });
    expect(res.status).toBe(404);
  });

  it("user B cannot PATCH user A's session log (404)", async () => {
    const log = await createSession({ sessionNumber: 99 });
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/${log.id}`, {
      method: "PATCH",
      headers: authed(authCookie2),
      body: JSON.stringify({ title: "Hijacked" }),
    });
    expect(res.status).toBe(404);
  });

  it("user B DELETE of user A's session returns 404", async () => {
    const log = await createSession({ sessionNumber: 98 });
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/sessions/${log.id}`, {
      method: "DELETE",
      headers: authed(authCookie2),
    });
    expect(res.status).toBe(404);
  });
});
