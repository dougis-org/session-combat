import fetch from "node-fetch";
import { createTestUser } from "./helpers/users";

interface ContentResponse {
  id: string;
  userId: string;
  campaignId: string;
  type: string;
  title: string;
  systemPrompt: string;
  userMessage: string;
  prompt: string;
  result?: string;
  notes?: string;
  chapter?: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: string;
}

const VALID_ITEM = {
  campaignId: "campaign-001",
  type: "npc",
  title: "Old Grigor",
  systemPrompt: "You are a DM assistant.",
  userMessage: "Create an innkeeper NPC.",
  prompt: "You are a DM assistant.\n\nCreate an innkeeper NPC.",
  chapter: "Chapter 1",
};

describe("Content API Integration Tests", () => {
  let baseUrl: string;
  let authCookie: string;
  let authCookie2: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
    authCookie = (await createTestUser(baseUrl, "content-test")).cookie;
    authCookie2 = (await createTestUser(baseUrl, "content-user2")).cookie;
  }, 30000);

  function authed(cookie = authCookie) {
    return { "Content-Type": "application/json", Cookie: cookie };
  }

  async function createItem(overrides: Partial<typeof VALID_ITEM> = {}, cookie = authCookie): Promise<ContentResponse> {
    const res = await fetch(`${baseUrl}/api/content`, {
      method: "POST",
      headers: authed(cookie),
      body: JSON.stringify({ ...VALID_ITEM, ...overrides }),
    });
    return res.json() as Promise<ContentResponse>;
  }

  // --- POST /api/content ---

  it("returns 401 for unauthenticated POST /api/content", async () => {
    const res = await fetch(`${baseUrl}/api/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_ITEM),
    });
    expect(res.status).toBe(401);
  });

  it("POST creates item and response contains all fields including systemPrompt, userMessage, prompt", async () => {
    const res = await fetch(`${baseUrl}/api/content`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify(VALID_ITEM),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as ContentResponse;
    expect(data.id).toBeTruthy();
    expect(data.systemPrompt).toBe(VALID_ITEM.systemPrompt);
    expect(data.userMessage).toBe(VALID_ITEM.userMessage);
    expect(data.prompt).toBe(VALID_ITEM.prompt);
    expect(data.title).toBe(VALID_ITEM.title);
    expect(data.type).toBe(VALID_ITEM.type);
    expect(data.chapter).toBe(VALID_ITEM.chapter);
    expect(data.createdAt).toBeTruthy();
    expect(data.updatedAt).toBeTruthy();
  });

  // --- GET /api/content ---

  it("returns 401 for unauthenticated GET /api/content", async () => {
    const res = await fetch(`${baseUrl}/api/content?campaignId=campaign-001`);
    expect(res.status).toBe(401);
  });

  it("GET lists items for campaignId, newest first", async () => {
    const cid = `campaign-list-${Date.now()}`;
    await createItem({ campaignId: cid, title: "First" });
    await new Promise(r => setTimeout(r, 10));
    await createItem({ campaignId: cid, title: "Second" });

    const res = await fetch(`${baseUrl}/api/content?campaignId=${cid}`, { headers: authed() });
    expect(res.status).toBe(200);
    const data = await res.json() as ContentResponse[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    // newest first
    const myItems = data.filter(i => i.title === "First" || i.title === "Second");
    expect(myItems[0].title).toBe("Second");
    expect(myItems[1].title).toBe("First");
  });

  it("GET filters by userId — item from another user not returned", async () => {
    const cid = `campaign-iso-${Date.now()}`;
    await createItem({ campaignId: cid, title: "User1 Item" }, authCookie);

    const res = await fetch(`${baseUrl}/api/content?campaignId=${cid}`, { headers: authed(authCookie2) });
    const data = await res.json() as ContentResponse[];
    expect(data.every(i => i.title !== "User1 Item")).toBe(true);
  });

  // --- PUT /api/content/[id] ---

  it("PUT updates result and notes; updatedAt advances", async () => {
    const item = await createItem();
    const before = new Date(item.updatedAt).getTime();

    await new Promise(r => setTimeout(r, 50));

    const res = await fetch(`${baseUrl}/api/content/${item.id}`, {
      method: "PUT",
      headers: authed(),
      body: JSON.stringify({ result: "AI response here", notes: "Some notes" }),
    });
    expect(res.status).toBe(200);

    const listRes = await fetch(`${baseUrl}/api/content?campaignId=${item.campaignId}`, { headers: authed() });
    const list = await listRes.json() as ContentResponse[];
    const updated = list.find(i => i.id === item.id);
    expect(updated?.result).toBe("AI response here");
    expect(updated?.notes).toBe("Some notes");
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(before);
  });

  // --- DELETE /api/content/[id] ---

  it("DELETE removes item; subsequent GET does not include it", async () => {
    const cid = `campaign-del-${Date.now()}`;
    const item = await createItem({ campaignId: cid });

    const delRes = await fetch(`${baseUrl}/api/content/${item.id}`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(delRes.status).toBe(204);

    const listRes = await fetch(`${baseUrl}/api/content?campaignId=${cid}`, { headers: authed() });
    const list = await listRes.json() as ContentResponse[];
    expect(list.find(i => i.id === item.id)).toBeUndefined();
  });

  it("DELETE returns 401 for unauthenticated request", async () => {
    const item = await createItem();
    const res = await fetch(`${baseUrl}/api/content/${item.id}`, { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
