/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import FormData from "form-data";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { registerTestUser } from "@/tests/integration/helpers/users";

const BASE_URL = () => process.env.TEST_BASE_URL!;

function smallJpeg(): Buffer {
  // Minimal valid JPEG (1x1 pixel, white)
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
  const inviteRes = await fetch(`${BASE_URL()}/api/campaigns/${campaignId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: dmCookie },
    body: JSON.stringify({ userId }),
  });
  expect(inviteRes.status).toBe(201);

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
    body: JSON.stringify({ name: "Attachment Test Campaign" }),
  });
  const data = (await res.json()) as { id: string };
  return data.id;
}

function makeFormWithFile(mimeType = "image/jpeg", sizeBytes?: number): FormData {
  const form = new FormData();
  const content = sizeBytes ? Buffer.alloc(sizeBytes) : smallJpeg();
  form.append("file", content, { filename: "test.jpg", contentType: mimeType });
  return form;
}

describe("POST /api/campaigns/[id]/attachments", () => {
  let dmCookie: string;
  let dmUserId: string;
  let playerCookie: string;
  let playerUserId: string;
  let nonMemberCookie: string;
  let campaignId: string;

  beforeAll(async () => {
    await connectToDatabase();

    const dm = await registerTestUser(BASE_URL(), "attach-dm");
    dmCookie = dm.cookie;
    dmUserId = dm.userId;

    const player = await registerTestUser(BASE_URL(), "attach-player");
    playerCookie = player.cookie;
    playerUserId = player.userId;

    const nonMember = await registerTestUser(BASE_URL(), "attach-nonmember");
    nonMemberCookie = nonMember.cookie;

    campaignId = await createCampaign(dmCookie);
    await addActiveMember(campaignId, dmCookie, playerUserId);
  }, 30000);

  afterAll(async () => {
    await closeDatabase();
  });

  const uploadUrl = () => `${BASE_URL()}/api/campaigns/${campaignId}/attachments`;

  // ─── Auth ─────────────────────────────────────────────────────────────────

  it("returns 401 for unauthenticated request", async () => {
    const form = makeFormWithFile();
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: form.getHeaders(),
      body: form,
    });
    expect(res.status).toBe(401);
  });

  // ─── Access control ───────────────────────────────────────────────────────

  it("returns 403 for player (non-DM) attempting upload", async () => {
    const form = makeFormWithFile();
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: playerCookie },
      body: form,
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-member attempting upload (campaign hidden)", async () => {
    const form = makeFormWithFile();
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: nonMemberCookie },
      body: form,
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent campaign", async () => {
    const form = makeFormWithFile();
    const res = await fetch(`${BASE_URL()}/api/campaigns/nonexistent-id/attachments`, {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(404);
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it("returns 400 when no file field present", async () => {
    const form = new FormData();
    form.append("other", "value");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("file is required");
  });

  it("returns 415 for unsupported MIME type (PDF)", async () => {
    const form = makeFormWithFile("application/pdf");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unsupported file type");
  });

  it("returns 413 for file exceeding 5 MB", async () => {
    const form = makeFormWithFile("image/jpeg", 5 * 1024 * 1024 + 1);
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("File exceeds 5 MB limit");
  });

  // ─── Success scenarios ────────────────────────────────────────────────────

  it("returns 201 with attachmentId for valid JPEG upload by DM", async () => {
    const form = makeFormWithFile("image/jpeg");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { attachmentId: string };
    expect(typeof body.attachmentId).toBe("string");
    expect(body.attachmentId).toHaveLength(24);
  });

  it("returns 201 for valid PNG upload", async () => {
    const form = makeFormWithFile("image/png");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { attachmentId: string };
    expect(typeof body.attachmentId).toBe("string");
  });

  it("returns 201 for valid WebP upload", async () => {
    const form = makeFormWithFile("image/webp");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { attachmentId: string };
    expect(typeof body.attachmentId).toBe("string");
  });

  it("returns 201 for valid GIF upload", async () => {
    const form = makeFormWithFile("image/gif");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { attachmentId: string };
    expect(typeof body.attachmentId).toBe("string");
  });

  // ─── Orphan sweep ─────────────────────────────────────────────────────────

  it("sweeps orphaned pending files older than 24h before inserting", async () => {
    const db = await getDatabase();

    // Insert an orphan: pending + 25h ago
    const { ObjectId, GridFSBucket } = await import("mongodb");
    const bucket = new GridFSBucket(db, { bucketName: "attachments" });
    const orphanId = new ObjectId();
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openUploadStreamWithId(orphanId, "orphan.jpg", {
        metadata: {
          campaignId,
          status: "pending",
          uploadedAt: staleDate,
          contentType: "image/jpeg",
        },
      });
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(smallJpeg());
    });

    // Upload triggers sweep
    const form = makeFormWithFile("image/jpeg");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(201);

    // Orphan should be gone
    const files = await bucket.find({ _id: orphanId }).toArray();
    expect(files).toHaveLength(0);
  });

  it("does not sweep recent pending files (< 24h old)", async () => {
    const db = await getDatabase();
    const { ObjectId, GridFSBucket } = await import("mongodb");
    const bucket = new GridFSBucket(db, { bucketName: "attachments" });
    const recentId = new ObjectId();
    const recentDate = new Date(Date.now() - 1000); // 1 second ago

    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openUploadStreamWithId(recentId, "recent.jpg", {
        metadata: {
          campaignId,
          status: "pending",
          uploadedAt: recentDate,
          contentType: "image/jpeg",
        },
      });
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(smallJpeg());
    });

    const form = makeFormWithFile("image/jpeg");
    const res = await fetch(uploadUrl(), {
      method: "POST",
      headers: { ...form.getHeaders(), Cookie: dmCookie },
      body: form,
    });
    expect(res.status).toBe(201);

    // Recent file should still exist
    const files = await bucket.find({ _id: recentId }).toArray();
    expect(files).toHaveLength(1);

    // Cleanup
    await bucket.delete(recentId);
  });
});
