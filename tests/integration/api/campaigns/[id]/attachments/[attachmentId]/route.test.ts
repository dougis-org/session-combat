/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import FormData from "form-data";
import { ObjectId, GridFSBucket } from "mongodb";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { registerTestUser } from "@/tests/integration/helpers/users";

const BASE_URL = () => process.env.TEST_BASE_URL!;

function smallJpeg(): Buffer {
  return Buffer.from(
    "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffffc0000b08000100010101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101000000011a00ffda00030101003f00ffa4ffd9",
    "hex"
  );
}

async function addActiveMember(
  campaignId: string,
  dmCookie: string,
  userId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL()}/api/campaigns/${campaignId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: dmCookie },
    body: JSON.stringify({ userId }),
  });
  expect(res.status).toBe(201);
  const db = await getDatabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.collection("campaignMembers").updateOne(
    { campaignId, userId },
    { $set: { status: "active" } } as any
  );
}

async function createCampaign(cookie: string): Promise<string> {
  const res = await fetch(`${BASE_URL()}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Serve Test Campaign" }),
  });
  return ((await res.json()) as { id: string }).id;
}

async function uploadFile(
  campaignId: string,
  cookie: string,
  mimeType = "image/jpeg"
): Promise<string> {
  const form = new FormData();
  form.append("file", smallJpeg(), { filename: "test.jpg", contentType: mimeType });
  const res = await fetch(`${BASE_URL()}/api/campaigns/${campaignId}/attachments`, {
    method: "POST",
    headers: { ...form.getHeaders(), Cookie: cookie },
    body: form,
  });
  if (res.status !== 201) throw new Error(`Upload failed: ${res.status}`);
  return ((await res.json()) as { attachmentId: string }).attachmentId;
}

describe("GET /api/campaigns/[id]/attachments/[attachmentId]", () => {
  let dmCookie: string;
  let playerCookie: string;
  let playerUserId: string;
  let nonMemberCookie: string;
  let campaignId: string;
  let attachmentId: string;

  beforeAll(async () => {
    await connectToDatabase();

    const dm = await registerTestUser(BASE_URL(), "serve-dm");
    dmCookie = dm.cookie;

    const player = await registerTestUser(BASE_URL(), "serve-player");
    playerCookie = player.cookie;
    playerUserId = player.userId;

    const nonMember = await registerTestUser(BASE_URL(), "serve-nonmember");
    nonMemberCookie = nonMember.cookie;

    campaignId = await createCampaign(dmCookie);
    await addActiveMember(campaignId, dmCookie, playerUserId);

    // Upload a file as DM so we have a valid attachmentId
    attachmentId = await uploadFile(campaignId, dmCookie);
  }, 30000);

  afterAll(async () => {
    await closeDatabase();
  });

  const serveUrl = (aid = attachmentId) =>
    `${BASE_URL()}/api/campaigns/${campaignId}/attachments/${aid}`;

  // ─── Auth ─────────────────────────────────────────────────────────────────

  it("returns 401 for unauthenticated request", async () => {
    const res = await fetch(serveUrl());
    expect(res.status).toBe(401);
  });

  // ─── Access control ───────────────────────────────────────────────────────

  it("returns 404 for non-member (campaign hidden)", async () => {
    const res = await fetch(serveUrl(), { headers: { Cookie: nonMemberCookie } });
    expect(res.status).toBe(404);
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it("returns 400 for invalid attachmentId format", async () => {
    const res = await fetch(
      `${BASE_URL()}/api/campaigns/${campaignId}/attachments/not-a-valid-objectid`,
      { headers: { Cookie: dmCookie } }
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid attachmentId");
  });

  // ─── Not found ────────────────────────────────────────────────────────────

  it("returns 404 for non-existent attachmentId", async () => {
    const nonExistentId = new ObjectId().toHexString();
    const res = await fetch(serveUrl(nonExistentId), { headers: { Cookie: dmCookie } });
    expect(res.status).toBe(404);
  });

  // ─── Cross-campaign isolation ──────────────────────────────────────────────

  it("returns 404 when attachmentId belongs to a different campaign", async () => {
    // Create a second campaign and upload a file there
    const dm2 = await registerTestUser(BASE_URL(), "serve-dm2");
    const campaign2Id = await createCampaign(dm2.cookie);
    const otherAttachmentId = await uploadFile(campaign2Id, dm2.cookie);

    // DM of campaign1 tries to access campaign2's attachment via campaign1's URL
    const res = await fetch(
      `${BASE_URL()}/api/campaigns/${campaignId}/attachments/${otherAttachmentId}`,
      { headers: { Cookie: dmCookie } }
    );
    expect(res.status).toBe(404);
  });

  // ─── Success scenarios ────────────────────────────────────────────────────

  it("returns 200 with image bytes and correct Content-Type for DM", async () => {
    const res = await fetch(serveUrl(), { headers: { Cookie: dmCookie } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    const body = await res.buffer();
    expect(body.length).toBeGreaterThan(0);
  });

  it("returns 200 with image bytes for active player member", async () => {
    const res = await fetch(serveUrl(), { headers: { Cookie: playerCookie } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    const body = await res.buffer();
    expect(body.length).toBeGreaterThan(0);
  });

  it("preserves the stored Content-Type for a PNG file", async () => {
    const pngId = await uploadFile(campaignId, dmCookie, "image/png");
    const res = await fetch(serveUrl(pngId), { headers: { Cookie: dmCookie } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });
});
