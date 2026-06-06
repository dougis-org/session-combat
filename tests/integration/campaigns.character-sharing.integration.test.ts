import { storage } from "@/lib/storage";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { DuplicateShareError } from "@/lib/errors";
import { CampaignCharacterShare } from "@/lib/types";

describe("Campaign Character Sharing Integration Tests", () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
    await connectToDatabase();
  }, 30000);

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    const db = await getDatabase();
    await db.collection("campaignCharacterShares").deleteMany({ campaignId: { $regex: "^int-camp-" } });
  });

  const makeShare = (overrides: Partial<CampaignCharacterShare> = {}): CampaignCharacterShare => ({
    id: crypto.randomUUID(),
    campaignId: "int-camp-1",
    characterId: "int-char-1",
    userId: "int-user-1",
    sharedAt: new Date(),
    ...overrides,
  });

  test("T7-1: addShare inserts and listSharesForCampaign returns it", async () => {
    const share = makeShare();
    await storage.addShare(share);

    const list = await storage.listSharesForCampaign("int-camp-1", "int-user-1");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(share.id);
    expect(list[0].characterId).toBe("int-char-1");
    expect(list[0].userId).toBe("int-user-1");
    expect(list[0]).not.toHaveProperty("_id");
  });

  test("T7-2: duplicate insert throws DuplicateShareError", async () => {
    const share = makeShare();
    await storage.addShare(share);

    const duplicate = makeShare({ id: crypto.randomUUID() });
    await expect(storage.addShare(duplicate)).rejects.toThrow(DuplicateShareError);
  });

  test("T7-3: removeShare returns true on success", async () => {
    const share = makeShare();
    await storage.addShare(share);

    const result = await storage.removeShare("int-camp-1", "int-char-1", "int-user-1");
    expect(result).toBe(true);

    const list = await storage.listSharesForCampaign("int-camp-1", "int-user-1");
    expect(list).toHaveLength(0);
  });

  test("T7-4: removeShare returns false on non-existent record", async () => {
    const result = await storage.removeShare("int-camp-1", "int-char-nonexistent", "int-user-1");
    expect(result).toBe(false);
  });

  test("T7-5: listSharesForCampaign does not return other users' shares", async () => {
    await storage.addShare(makeShare({ id: crypto.randomUUID(), characterId: "int-char-x", userId: "int-user-1" }));
    await storage.addShare(makeShare({ id: crypto.randomUUID(), characterId: "int-char-z", userId: "int-user-2" }));

    const p1List = await storage.listSharesForCampaign("int-camp-1", "int-user-1");
    const p2List = await storage.listSharesForCampaign("int-camp-1", "int-user-2");

    expect(p1List).toHaveLength(1);
    expect(p1List[0].characterId).toBe("int-char-x");

    expect(p2List).toHaveLength(1);
    expect(p2List[0].characterId).toBe("int-char-z");
  });

  test("T7-6: same character can be shared into two different campaigns", async () => {
    await storage.addShare(makeShare({ id: crypto.randomUUID(), campaignId: "int-camp-1", characterId: "int-char-1" }));
    await storage.addShare(makeShare({ id: crypto.randomUUID(), campaignId: "int-camp-2", characterId: "int-char-1" }));

    const camp1List = await storage.listSharesForCampaign("int-camp-1", "int-user-1");
    const camp2List = await storage.listSharesForCampaign("int-camp-2", "int-user-1");

    expect(camp1List).toHaveLength(1);
    expect(camp2List).toHaveLength(1);
  });
});
