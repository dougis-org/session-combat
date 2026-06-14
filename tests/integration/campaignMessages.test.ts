/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { registerTestUser } from "./helpers/users";
import type { CampaignMessage } from "@/lib/types";

const MESSAGES_PATH = (campaignId: string) =>
  `${process.env.TEST_BASE_URL}/api/campaigns/${campaignId}/messages`;

const STREAM_PATH = (campaignId: string) =>
  `${process.env.TEST_BASE_URL}/api/campaigns/${campaignId}/stream`;

interface UserCtx {
  cookie: string;
  userId: string;
  username: string;
}

interface MessagesResponse {
  messages: CampaignMessage[];
  nextCursor?: string;
}

async function createCampaign(cookie: string): Promise<string> {
  const res = await fetch(`${process.env.TEST_BASE_URL}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Messages Test Campaign" }),
  });
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function addActiveMember(
  campaignId: string,
  dmCookie: string,
  userId: string,
  dmUserId: string
): Promise<void> {
  // DM invites the player
  const inviteRes = await fetch(
    `${process.env.TEST_BASE_URL}/api/campaigns/${campaignId}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dmCookie },
      body: JSON.stringify({ userId }),
    }
  );
  expect(inviteRes.status).toBe(201);

  // Player accepts (updates status to active) by accepting the invitation
  const db = await getDatabase();
  await db.collection("campaignMembers").updateOne(
    { campaignId, userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $set: { status: "active" } } as any
  );
  void dmUserId;
}

async function openSSEConnection(
  campaignId: string,
  cookie: string
): Promise<{ events: string[]; abort: () => void }> {
  const controller = new AbortController();
  const events: string[] = [];

  const res = await fetch(STREAM_PATH(campaignId), {
    headers: { Cookie: cookie },
    signal: controller.signal as unknown as AbortSignal,
  });

  if (!res.ok || !res.body) {
    controller.abort();
    throw new Error(`SSE connection failed: ${res.status}`);
  }

  // Collect events in background
  (async () => {
    try {
      const body = res.body!;
      let buffer = "";
      for await (const chunk of body as unknown as AsyncIterable<Buffer>) {
        buffer += chunk.toString();
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (part.trim()) events.push(part);
        }
      }
    } catch {
      // connection closed
    }
  })();

  return { events, abort: () => controller.abort() };
}

describe("Campaign Messages Integration Tests", () => {
  let baseUrl: string;
  let dm: UserCtx;
  let playerA: UserCtx;
  let playerB: UserCtx;
  let playerC: UserCtx;
  let dm2: UserCtx;
  let campaignId: string;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set");

    await connectToDatabase();

    dm = await registerTestUser(baseUrl, "msg-dm");
    playerA = await registerTestUser(baseUrl, "msg-playerA");
    playerB = await registerTestUser(baseUrl, "msg-playerB");
    playerC = await registerTestUser(baseUrl, "msg-playerC");
    dm2 = await registerTestUser(baseUrl, "msg-dm2");

    // DM creates campaign (becomes active DM member automatically)
    campaignId = await createCampaign(dm.cookie);

    // Add players A, B, C as active members
    await addActiveMember(campaignId, dm.cookie, playerA.userId, dm.userId);
    await addActiveMember(campaignId, dm.cookie, playerB.userId, dm.userId);
    await addActiveMember(campaignId, dm.cookie, playerC.userId, dm.userId);

    // Add dm2 as a co-DM
    await addActiveMember(campaignId, dm.cookie, dm2.userId, dm.userId);
    const db = await getDatabase();
    await db.collection("campaignMembers").updateOne(
      { campaignId, userId: dm2.userId },
      { $set: { role: "dm" } }
    );
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    const db = await getDatabase();
    await db.collection("campaignMessages").deleteMany({ campaignId });
  });

  // --- POST: active member sends messages ---

  it("T6.1 — active player POSTs group message → 201 with CampaignMessage document", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "Hello everyone", visibility: { scope: "group" } }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as CampaignMessage;
    expect(data.id).toBeDefined();
    expect(data.campaignId).toBe(campaignId);
    expect(data.senderId).toBe(playerA.userId);
    expect(data.text).toBe("Hello everyone");
    expect(data.visibility).toEqual({ scope: "group" });
    expect(data.createdAt).toBeDefined();
  });

  it("T6.2 — active player POSTs direct message with valid toUserId → 201", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({
        text: "Whisper",
        visibility: { scope: "direct", toUserId: playerB.userId },
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as CampaignMessage;
    expect(data.visibility).toEqual({ scope: "direct", toUserId: playerB.userId });
  });

  it("T6.3 — active player POSTs dm-only message → 201", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "DM note", visibility: { scope: "dm-only" } }),
    });
    expect(res.status).toBe(201);
  });

  it("T6.4 — non-member POSTs → 403", async () => {
    const outsider = await registerTestUser(baseUrl, "msg-outsider");
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: outsider.cookie },
      body: JSON.stringify({ text: "Hack", visibility: { scope: "group" } }),
    });
    expect(res.status).toBe(403);
  });

  it("T6.5 — invited member cannot POST → 403", async () => {
    const invited = await registerTestUser(baseUrl, "msg-invited");
    await fetch(`${baseUrl}/api/campaigns/${campaignId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({ userId: invited.userId }),
    });
    // member is invited (not active) — send request
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: invited.cookie },
      body: JSON.stringify({ text: "Try", visibility: { scope: "group" } }),
    });
    expect(res.status).toBe(403);
  });

  it("T6.6 — removed member cannot POST → 403", async () => {
    const db = await getDatabase();
    const removedUser = await registerTestUser(baseUrl, "msg-removed");
    await addActiveMember(campaignId, dm.cookie, removedUser.userId, dm.userId);
    await db.collection("campaignMembers").updateOne(
      { campaignId, userId: removedUser.userId },
      { $set: { status: "removed" } }
    );
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: removedUser.cookie },
      body: JSON.stringify({ text: "Ghost post", visibility: { scope: "group" } }),
    });
    expect(res.status).toBe(403);
  });

  it("T6.7 — missing text field → 400", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ visibility: { scope: "group" } }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, string>;
    expect(body.error).toBeDefined();
    expect(body.error).not.toContain("message");
  });

  it("T6.8 — missing visibility field → 400", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "No visibility" }),
    });
    expect(res.status).toBe(400);
  });

  it("T6.9 — direct message without toUserId → 400", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "Whisper", visibility: { scope: "direct" } }),
    });
    expect(res.status).toBe(400);
  });

  it("T6.10 — POST persists message retrievable via GET", async () => {
    await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "Persistent", visibility: { scope: "group" } }),
    });
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerA.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "Persistent")).toBe(true);
  });

  // --- GET: visibility filtering ---

  it("T7.1 — active member GETs 3 group messages in descending order", async () => {
    const db = await getDatabase();
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      await db.collection("campaignMessages").insertOne({
        id: crypto.randomUUID(),
        campaignId,
        senderId: playerA.userId,
        senderName: "A",
        text: `Group ${i}`,
        visibility: { scope: "group" },
        createdAt: new Date(now + i * 1000),
      });
    }
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerA.cookie },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages).toHaveLength(3);
    // descending by createdAt
    expect(new Date(data.messages[0].createdAt) >= new Date(data.messages[1].createdAt)).toBe(true);
  });

  it("T7.2 — player C cannot see direct message from A to B", async () => {
    const db = await getDatabase();
    await db.collection("campaignMessages").insertOne({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: "Whisper A to B",
      visibility: { scope: "direct", toUserId: playerB.userId },
      createdAt: new Date(),
    });
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerC.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "Whisper A to B")).toBe(false);
  });

  it("T7.3 — player B can see direct message addressed to them", async () => {
    const db = await getDatabase();
    await db.collection("campaignMessages").insertOne({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: "For B only",
      visibility: { scope: "direct", toUserId: playerB.userId },
      createdAt: new Date(),
    });
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerB.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "For B only")).toBe(true);
  });

  it("T7.4 — sender (player A) can see their own sent direct message", async () => {
    const db = await getDatabase();
    await db.collection("campaignMessages").insertOne({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: "Sent by A",
      visibility: { scope: "direct", toUserId: playerB.userId },
      createdAt: new Date(),
    });
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerA.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "Sent by A")).toBe(true);
  });

  it("T7.5 — player cannot see dm-only messages", async () => {
    const db = await getDatabase();
    await db.collection("campaignMessages").insertOne({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: "DM secret",
      visibility: { scope: "dm-only" },
      createdAt: new Date(),
    });
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerB.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "DM secret")).toBe(false);
  });

  it("T7.6 — DM sees all visible messages including dm-only", async () => {
    const db = await getDatabase();
    const now = Date.now();
    await db.collection("campaignMessages").insertMany([
      {
        id: crypto.randomUUID(), campaignId, senderId: playerA.userId, senderName: "A",
        text: "Group msg", visibility: { scope: "group" }, createdAt: new Date(now),
      },
      {
        id: crypto.randomUUID(), campaignId, senderId: playerA.userId, senderName: "A",
        text: "DM only msg", visibility: { scope: "dm-only" }, createdAt: new Date(now + 1000),
      },
    ]);
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: dm.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "Group msg")).toBe(true);
    expect(data.messages.some(m => m.text === "DM only msg")).toBe(true);
  });

  it("T7.7 — pagination: 60 messages, first page returns 50 + nextCursor", async () => {
    const db = await getDatabase();
    const now = Date.now();
    const docs = Array.from({ length: 60 }, (_, i) => ({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: `Msg ${i}`,
      visibility: { scope: "group" },
      createdAt: new Date(now + i * 1000),
    }));
    await db.collection("campaignMessages").insertMany(docs);

    const res = await fetch(`${MESSAGES_PATH(campaignId)}?limit=50`, {
      headers: { Cookie: playerA.cookie },
    });
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages).toHaveLength(50);
    expect(data.nextCursor).toBeDefined();
  });

  it("T7.8 — pagination: second page with before cursor returns remaining 10", async () => {
    const db = await getDatabase();
    const now = Date.now();
    const docs = Array.from({ length: 60 }, (_, i) => ({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: `Page2 Msg ${i}`,
      visibility: { scope: "group" },
      createdAt: new Date(now + i * 1000),
    }));
    await db.collection("campaignMessages").insertMany(docs);

    const firstRes = await fetch(`${MESSAGES_PATH(campaignId)}?limit=50`, {
      headers: { Cookie: playerA.cookie },
    });
    const firstData = (await firstRes.json()) as MessagesResponse;
    expect(firstData.nextCursor).toBeDefined();

    const secondRes = await fetch(
      `${MESSAGES_PATH(campaignId)}?limit=50&before=${encodeURIComponent(firstData.nextCursor!)}`,
      { headers: { Cookie: playerA.cookie } }
    );
    const secondData = (await secondRes.json()) as MessagesResponse;
    expect(secondData.messages).toHaveLength(10);
    expect(secondData.nextCursor).toBeUndefined();
  });

  it("T7.9 — non-member cannot GET messages → 403", async () => {
    const outsider = await registerTestUser(baseUrl, "msg-get-outsider");
    const res = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: outsider.cookie },
    });
    expect(res.status).toBe(403);
  });

  it("T7.10 — limit > 100 is capped at 100", async () => {
    const db = await getDatabase();
    const now = Date.now();
    const docs = Array.from({ length: 110 }, (_, i) => ({
      id: crypto.randomUUID(),
      campaignId,
      senderId: playerA.userId,
      senderName: "A",
      text: `Cap Msg ${i}`,
      visibility: { scope: "group" },
      createdAt: new Date(now + i * 1000),
    }));
    await db.collection("campaignMessages").insertMany(docs);

    const res = await fetch(`${MESSAGES_PATH(campaignId)}?limit=200`, {
      headers: { Cookie: playerA.cookie },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as MessagesResponse;
    expect(data.messages.length).toBeLessThanOrEqual(100);
  });

  // --- SSE: filtered event emission ---

  it("T8.1 — group message POST: all active SSE subscribers receive a message event", async () => {
    const connA = await openSSEConnection(campaignId, playerA.cookie);
    const connB = await openSSEConnection(campaignId, playerB.cookie);
    const connDM = await openSSEConnection(campaignId, dm.cookie);

    await new Promise(r => setTimeout(r, 200));

    await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "Group for all", visibility: { scope: "group" } }),
    });

    await new Promise(r => setTimeout(r, 300));

    const hasMessageEvent = (events: string[]) =>
      events.some(e => e.includes('"type":"message"') || e.includes("event: message"));

    expect(hasMessageEvent(connA.events)).toBe(true);
    expect(hasMessageEvent(connB.events)).toBe(true);
    expect(hasMessageEvent(connDM.events)).toBe(true);

    connA.abort();
    connB.abort();
    connDM.abort();
  });

  it("T8.2 — direct message: only sender A and recipient B receive SSE; player C does NOT", async () => {
    const connA = await openSSEConnection(campaignId, playerA.cookie);
    const connB = await openSSEConnection(campaignId, playerB.cookie);
    const connC = await openSSEConnection(campaignId, playerC.cookie);

    await new Promise(r => setTimeout(r, 200));

    await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({
        text: "Direct whisper",
        visibility: { scope: "direct", toUserId: playerB.userId },
      }),
    });

    await new Promise(r => setTimeout(r, 300));

    const hasMessageEvent = (events: string[]) =>
      events.some(e => e.includes('"type":"message"') || e.includes("event: message"));

    expect(hasMessageEvent(connA.events)).toBe(true);
    expect(hasMessageEvent(connB.events)).toBe(true);
    expect(hasMessageEvent(connC.events)).toBe(false);

    connA.abort();
    connB.abort();
    connC.abort();
  });

  it("T8.3 — dm-only: sender and all active DMs receive; other players excluded", async () => {
    const connA = await openSSEConnection(campaignId, playerA.cookie);
    const connB = await openSSEConnection(campaignId, playerB.cookie);
    const connDM = await openSSEConnection(campaignId, dm.cookie);
    const connDM2 = await openSSEConnection(campaignId, dm2.cookie);

    await new Promise(r => setTimeout(r, 200));

    await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "DM only msg", visibility: { scope: "dm-only" } }),
    });

    await new Promise(r => setTimeout(r, 300));

    const hasMessageEvent = (events: string[]) =>
      events.some(e => e.includes('"type":"message"') || e.includes("event: message"));

    expect(hasMessageEvent(connA.events)).toBe(true);   // sender
    expect(hasMessageEvent(connDM.events)).toBe(true);  // DM
    expect(hasMessageEvent(connDM2.events)).toBe(true); // co-DM
    expect(hasMessageEvent(connB.events)).toBe(false);  // other player excluded

    connA.abort();
    connB.abort();
    connDM.abort();
    connDM2.abort();
  });

  it("T8.4 — two co-DM subscribers both receive dm-only event", async () => {
    const connDM = await openSSEConnection(campaignId, dm.cookie);
    const connDM2 = await openSSEConnection(campaignId, dm2.cookie);

    await new Promise(r => setTimeout(r, 200));

    await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({ text: "Co-DM message", visibility: { scope: "dm-only" } }),
    });

    await new Promise(r => setTimeout(r, 300));

    const hasMessageEvent = (events: string[]) =>
      events.some(e => e.includes('"type":"message"') || e.includes("event: message"));

    expect(hasMessageEvent(connDM.events)).toBe(true);
    expect(hasMessageEvent(connDM2.events)).toBe(true);

    connDM.abort();
    connDM2.abort();
  });

  it("T8.5 — POST with no SSE subscribers does not throw; message is retrievable via GET", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "No subscribers", visibility: { scope: "group" } }),
    });
    expect(res.status).toBe(201);

    const getRes = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: playerA.cookie },
    });
    const data = (await getRes.json()) as MessagesResponse;
    expect(data.messages.some(m => m.text === "No subscribers")).toBe(true);
  });

  it("T8.6 — SSE event data matches persisted CampaignMessage document", async () => {
    const conn = await openSSEConnection(campaignId, playerA.cookie);
    await new Promise(r => setTimeout(r, 200));

    const postRes = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ text: "SSE data match", visibility: { scope: "group" } }),
    });
    const posted = (await postRes.json()) as CampaignMessage;

    await new Promise(r => setTimeout(r, 300));

    const messageEvent = conn.events.find(e => e.includes('"type":"message"') || e.includes("event: message"));
    expect(messageEvent).toBeDefined();

    const dataLine = messageEvent!.split("\n").find(l => l.startsWith("data:"));
    expect(dataLine).toBeDefined();
    const parsed = JSON.parse(dataLine!.replace(/^data:\s*/, ""));
    expect(parsed.data.id).toBe(posted.id);
    expect(parsed.data.text).toBe("SSE data match");

    conn.abort();
  });
});
