/**
 * GridFS round-trip coverage for the mongodb v6 -> v7 upgrade (issue #638) — the official
 * v7 changelog doesn't itemize any GridFSBucket-specific changes, so this is runtime
 * evidence rather than a documentation-review conclusion.
 *
 * EXCLUDED FROM SHARED SERVER MIGRATION — same rationale as dedupeEngine.integration.test.ts:
 * manages its own dedicated MongoDB container and imports library code directly.
 */
import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { ObjectId, type Db, type GridFSBucket } from "mongodb";

describe("mongodb v7 upgrade: GridFS attachment round-trip (issue #638)", () => {
  let mongoContainer: StartedMongoDBContainer;
  let uri: string;
  let db: Db;
  let getAttachmentsBucket: (db: Db) => GridFSBucket;
  let uploadAttachment: (bucket: GridFSBucket, file: File, campaignId: string) => Promise<string>;
  let openDownloadStream: (
    bucket: GridFSBucket,
    attachmentId: string
  ) => Promise<{ stream: NodeJS.ReadableStream; contentType: string; campaignId: string }>;
  let updateAttachmentStatus: (db: Db, attachmentId: string, status: string) => Promise<void>;
  let verifyAttachmentCampaign: (db: Db, attachmentId: string, campaignId: string) => Promise<boolean>;
  let deleteOrphanedAttachments: (bucket: GridFSBucket, campaignId: string, thresholdMs?: number) => Promise<void>;

  let savedUri: string | undefined;
  let savedDb: string | undefined;

  beforeAll(async () => {
    mongoContainer = await new MongoDBContainer("mongo:8").withExposedPorts(27017).start();
    uri = `${mongoContainer.getConnectionString()}/?directConnection=true`;

    savedUri = process.env.MONGODB_URI;
    savedDb = process.env.MONGODB_DB;
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB = "session-combat-test";

    jest.resetModules();
    const gridfsMod = await import("@/lib/gridfs");
    getAttachmentsBucket = gridfsMod.getAttachmentsBucket;
    uploadAttachment = gridfsMod.uploadAttachment;
    openDownloadStream = gridfsMod.openDownloadStream;
    updateAttachmentStatus = gridfsMod.updateAttachmentStatus;
    verifyAttachmentCampaign = gridfsMod.verifyAttachmentCampaign;
    deleteOrphanedAttachments = gridfsMod.deleteOrphanedAttachments;

    const dbMod = await import("@/lib/db");
    db = await dbMod.getDatabase();
  }, 120000);

  afterAll(async () => {
    const dbMod = await import("@/lib/db");
    await dbMod.closeDatabase();
    await mongoContainer?.stop();
    if (savedUri !== undefined) process.env.MONGODB_URI = savedUri; else delete process.env.MONGODB_URI;
    if (savedDb !== undefined) process.env.MONGODB_DB = savedDb; else delete process.env.MONGODB_DB;
  }, 30000);

  it("uploads, locates, downloads, updates status, verifies, and deletes an attachment", async () => {
    const bucket = getAttachmentsBucket(db);
    const campaignId = `campaign-${Date.now()}`;
    const content = Buffer.from("v7 driver gridfs round-trip content — byte for byte");
    const file = new File([content], "note.txt", { type: "text/plain" });

    const attachmentId = await uploadAttachment(bucket, file, campaignId);
    expect(/^[0-9a-f]{24}$/i.test(attachmentId)).toBe(true);

    const { stream, contentType, campaignId: foundCampaignId } = await openDownloadStream(bucket, attachmentId);
    expect(contentType).toBe("text/plain");
    expect(foundCampaignId).toBe(campaignId);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    expect(Buffer.concat(chunks).equals(content)).toBe(true);

    await updateAttachmentStatus(db, attachmentId, "complete");
    const fileDoc = await db.collection("attachments.files").findOne({ _id: new ObjectId(attachmentId) });
    expect(fileDoc?.metadata?.status).toBe("complete");
    expect(fileDoc?.metadata?.campaignId).toBe(campaignId);
    expect(fileDoc?.metadata?.contentType).toBe("text/plain");
    expect(fileDoc?.metadata?.uploadedAt).toBeInstanceOf(Date);

    expect(await verifyAttachmentCampaign(db, attachmentId, campaignId)).toBe(true);

    await bucket.delete(new ObjectId(attachmentId));
    expect(await verifyAttachmentCampaign(db, attachmentId, campaignId)).toBe(false);
  });

  it("rejects a malformed (non-hex) attachment id with the existing INVALID_ID error shape", async () => {
    const bucket = getAttachmentsBucket(db);
    await expect(openDownloadStream(bucket, "not-a-valid-id")).rejects.toMatchObject({ code: "INVALID_ID" });
    expect(await verifyAttachmentCampaign(db, "not-a-valid-id", "any-campaign")).toBe(false);
  });

  it("deleteOrphanedAttachments removes pending attachments past the threshold", async () => {
    const bucket = getAttachmentsBucket(db);
    const campaignId = `orphan-${Date.now()}`;
    const file = new File([Buffer.from("orphan")], "orphan.txt", { type: "text/plain" });
    const attachmentId = await uploadAttachment(bucket, file, campaignId);

    // Backdate uploadedAt so it's past the (small, explicit) threshold used below.
    await db.collection("attachments.files").updateOne(
      { _id: new ObjectId(attachmentId) },
      { $set: { "metadata.uploadedAt": new Date(Date.now() - 10_000) } }
    );

    await deleteOrphanedAttachments(bucket, campaignId, 1000);
    expect(await verifyAttachmentCampaign(db, attachmentId, campaignId)).toBe(false);
  });
});
