/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { registerTestUser } from "../helpers/users";
import type { CampaignMessage } from "@/lib/types";

const MESSAGES_PATH = (campaignId: string) =>
  `${process.env.TEST_BASE_URL}/api/campaigns/${encodeURIComponent(campaignId)}/messages`;

interface UserCtx {
  cookie: string;
  userId: string;
  username: string;
}

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

async function createCampaign(cookie: string): Promise<string> {
  const res = await fetch(`${process.env.TEST_BASE_URL}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Scene Messages Integration Test" }),
  });
  const data = (await res.json()) as { id: string };
  if (!OBJECT_ID_RE.test(data.id)) throw new Error(`Unexpected campaign id: ${data.id}`);
  return data.id;
}

async function addActiveMember(
  campaignId: string,
  dmCookie: string,
  userId: string
): Promise<void> {
  const inviteRes = await fetch(
    `${process.env.TEST_BASE_URL}/api/campaigns/${encodeURIComponent(campaignId)}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dmCookie },
      body: JSON.stringify({ userId }),
    }
  );
  expect(inviteRes.status).toBe(201);

  const db = await getDatabase();
  await db.collection("campaignMembers").updateOne(
    { campaignId, userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $set: { status: "active" } } as any
  );
}

describe("Campaign Messages — Scene Kind Integration Tests", () => {
  let dm: UserCtx;
  let player: UserCtx;
  let campaignId: string;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
    if (!process.env.TEST_BASE_URL) throw new Error("TEST_BASE_URL not set");

    await connectToDatabase();

    dm = await registerTestUser(process.env.TEST_BASE_URL, "scene-dm");
    player = await registerTestUser(process.env.TEST_BASE_URL, "scene-player");

    campaignId = await createCampaign(dm.cookie);
    await addActiveMember(campaignId, dm.cookie, player.userId);
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    const db = await getDatabase();
    await db.collection("campaignMessages").deleteMany({ campaignId });
  });

  it("T2-1: DM POSTs scene with attachmentId + text → 201; GET returns kind:'scene'", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({
        kind: "scene",
        attachmentId: "fake-attachment-id",
        text: "The tavern interior",
        visibility: { scope: "group" },
      }),
    });
    expect(res.status).toBe(201);
    const msg = (await res.json()) as CampaignMessage;
    expect(msg.kind).toBe("scene");
    expect(msg.attachmentId).toBe("fake-attachment-id");
    expect(msg.text).toBe("The tavern interior");

    const getRes = await fetch(MESSAGES_PATH(campaignId), {
      headers: { Cookie: dm.cookie },
    });
    const data = (await getRes.json()) as { messages: CampaignMessage[] };
    const found = data.messages.find(m => m.id === msg.id);
    expect(found?.kind).toBe("scene");
  });

  it("T2-2: Non-DM member POSTs kind:'scene' → 403", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: player.cookie },
      body: JSON.stringify({
        kind: "scene",
        text: "Sneaky scene",
        visibility: { scope: "group" },
      }),
    });
    expect(res.status).toBe(403);
  });

  it("T2-3: DM POSTs scene with no text and no attachmentId → 400", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({
        kind: "scene",
        visibility: { scope: "group" },
      }),
    });
    expect(res.status).toBe(400);
  });

  it("T2-4: Existing chat POST (no kind, valid text) → 201; kind absent (regression)", async () => {
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: player.cookie },
      body: JSON.stringify({
        text: "Hello world",
        visibility: { scope: "group" },
      }),
    });
    expect(res.status).toBe(201);
    const msg = (await res.json()) as CampaignMessage;
    expect(msg.kind).toBeUndefined();
  });
});
