/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import { ObjectId } from "mongodb";
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

const CAMPAIGN_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function createCampaign(cookie: string): Promise<string> {
  const res = await fetch(`${process.env.TEST_BASE_URL}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Scene Messages Integration Test" }),
  });
  const data = (await res.json()) as { id: string };
  if (!CAMPAIGN_ID_RE.test(data.id))
    throw new Error(`Unexpected campaign id: ${data.id}`);
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

async function insertTestAttachment(campaignId: string): Promise<string> {
  const db = await getDatabase();
  const id = new ObjectId();
  await db.collection("attachments.files").insertOne({
    _id: id,
    filename: "test.jpg",
    length: 1,
    chunkSize: 255 * 1024,
    uploadDate: new Date(),
    metadata: { campaignId, status: "active", contentType: "image/jpeg" },
  });
  return id.toHexString();
}

describe("Campaign Messages — Scene Kind Integration Tests", () => {
  let dm: UserCtx;
  let player: UserCtx;
  let campaignId: string;
  let testAttachmentId: string;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
    if (!process.env.TEST_BASE_URL) throw new Error("TEST_BASE_URL not set");

    await connectToDatabase();

    dm = await registerTestUser(process.env.TEST_BASE_URL, "scene-dm");
    player = await registerTestUser(process.env.TEST_BASE_URL, "scene-player");

    campaignId = await createCampaign(dm.cookie);
    await addActiveMember(campaignId, dm.cookie, player.userId);
    testAttachmentId = await insertTestAttachment(campaignId);
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
        attachmentId: testAttachmentId,
        text: "The tavern interior",
        visibility: { scope: "group" },
      }),
    });
    expect(res.status).toBe(201);
    const msg = (await res.json()) as CampaignMessage;
    expect(msg.kind).toBe("scene");
    expect(msg.attachmentId).toBe(testAttachmentId);
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

  it("T2-5: DM POSTs scene with attachmentId from different campaign → 400", async () => {
    const otherCampaignId = await createCampaign(dm.cookie);
    const otherId = await insertTestAttachment(otherCampaignId);
    const res = await fetch(MESSAGES_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({
        kind: "scene",
        attachmentId: otherId,
        visibility: { scope: "group" },
      }),
    });
    expect(res.status).toBe(400);
  });
});
