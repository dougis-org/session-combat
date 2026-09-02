/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/rollRepo";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  installStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
  expectFacadeMethods,
} from "./_repoMock";

const getLogSpy = installStorageLogSpy();
const DB_DOWN = () => new Error("db down");
const ROLL = { id: "r1", campaignId: "c1", sessionId: "s1", rollerId: "u1" } as never;
const mkDocs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ _id: `x${i}`, id: `r${i}`, createdAt: new Date(2026, 0, 1, 0, 0, i) }));

describe("rollRepo", () => {
  describe("saveCampaignRoll", () => {
    it("inserts the roll doc without _id", async () => {
      const col = mockCollection();
      await repo.saveCampaignRoll(ROLL);
      expect(col.insertOne).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }));
    });
  });

  describe("listCampaignRolls", () => {
    it("returns { rolls } with no cursor when the page is not full", async () => {
      mockCollection({ findResult: mkDocs(2) });
      const res = await repo.listCampaignRolls("c1", "s1", "u1", "player", { limit: 5 });
      expect(res.rolls.map((r) => (r as { id: string }).id)).toEqual(["r0", "r1"]);
      expect(res.nextCursor).toBeUndefined();
      expect(res.rolls[0]).not.toHaveProperty("_id");
    });

    it("pops the extra row and returns nextCursor when limit+1 rows come back", async () => {
      mockCollection({ findResult: mkDocs(4) });
      const res = await repo.listCampaignRolls("c1", "s1", "u1", "player", { limit: 3 });
      expect(res.rolls).toHaveLength(3);
      expect(res.nextCursor).toBe(mkDocs(4)[2].createdAt.toISOString());
    });

    it("adds the dm-only visibility clause only for a dm", async () => {
      const col = mockCollection({ findResult: [] });
      await repo.listCampaignRolls("c1", "s1", "u1", "dm", { limit: 5 });
      const dmQuery = (col.find.mock.calls[0] as unknown[])[0] as { $or: unknown[] };
      expect(dmQuery.$or).toContainEqual({ "visibility.scope": "dm-only" });

      const col2 = mockCollection({ findResult: [] });
      await repo.listCampaignRolls("c1", "s1", "u1", "player", { limit: 5 });
      const pQuery = (col2.find.mock.calls[0] as unknown[])[0] as { $or: unknown[] };
      expect(pQuery.$or).not.toContainEqual({ "visibility.scope": "dm-only" });
    });
  });

  describe.each<[string, () => Promise<unknown>]>([
    ["saveCampaignRoll", () => repo.saveCampaignRoll(ROLL)],
    ["listCampaignRolls", () => repo.listCampaignRolls("c1", "s1", "u1", "player", { limit: 5 })],
  ])("%s on driver failure", (name, call) => {
    it("rejects with StorageError and logs one error event", async () => {
      mockCollection({ findResult: DB_DOWN(), insertOne: DB_DOWN() });
      await expectStorageError(call(), { op: name, collection: "campaignRolls" });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  it("exposes both methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, ["saveCampaignRoll", "listCampaignRolls"]);
  });
});
