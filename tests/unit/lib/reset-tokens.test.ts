import {
  generateResetToken,
  hashToken,
  storeResetToken,
  validateResetToken,
  consumeResetToken,
  ResetTokenDocument,
} from "@/lib/reset-tokens";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedDb = { collection: jest.fn() };
jest.mocked(getDatabase).mockResolvedValue(mockedDb as any);

function makeCollection(overrides: Partial<{
  findOne: jest.Mock;
  insertOne: jest.Mock;
  deleteMany: jest.Mock;
  updateOne: jest.Mock;
}> = {}) {
  return {
    findOne: jest.fn(),
    insertOne: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe("lib/reset-tokens.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateResetToken", () => {
    it("returns a 64-character hex string", () => {
      const token = generateResetToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("never returns the same value on successive calls", () => {
      const a = generateResetToken();
      const b = generateResetToken();
      expect(a).not.toBe(b);
    });
  });

  describe("hashToken", () => {
    it("is deterministic — same input produces same output", () => {
      const token = "abc123";
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it("output does not equal input", () => {
      const token = generateResetToken();
      expect(hashToken(token)).not.toBe(token);
    });
  });

  describe("storeResetToken", () => {
    it("deletes prior tokens for the userId before inserting", async () => {
      const col = makeCollection();
      mockedDb.collection.mockReturnValue(col);

      await storeResetToken("user-1", "hash-a");
      expect(col.deleteMany).toHaveBeenCalledWith({ userId: "user-1" });
      expect(col.insertOne).toHaveBeenCalledTimes(1);
    });

    it("calling twice for the same userId invalidates the first token", async () => {
      const col = makeCollection();
      mockedDb.collection.mockReturnValue(col);

      await storeResetToken("user-1", "hash-a");
      await storeResetToken("user-1", "hash-b");

      // deleteMany called twice (once per storeResetToken call)
      expect(col.deleteMany).toHaveBeenCalledTimes(2);
      expect(col.deleteMany).toHaveBeenNthCalledWith(2, { userId: "user-1" });
    });
  });

  describe("validateResetToken", () => {
    it("throws for an unknown token (not found in DB)", async () => {
      const col = makeCollection({ findOne: jest.fn().mockResolvedValue(null) });
      mockedDb.collection.mockReturnValue(col);

      await expect(validateResetToken("unknown-token")).rejects.toThrow(
        /invalid|unknown/i
      );
    });

    it("throws for an expired token (expiresAt in the past)", async () => {
      const col = makeCollection({
        findOne: jest.fn().mockResolvedValue({
          userId: "user-1",
          tokenHash: "some-hash",
          expiresAt: new Date(Date.now() - 1000),
          createdAt: new Date(),
        } satisfies ResetTokenDocument),
      });
      mockedDb.collection.mockReturnValue(col);

      await expect(validateResetToken("expired-token")).rejects.toThrow(/expired/i);
    });

    it("throws for a consumed token (consumedAt set)", async () => {
      const col = makeCollection({
        findOne: jest.fn().mockResolvedValue({
          userId: "user-1",
          tokenHash: "some-hash",
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: new Date(),
          createdAt: new Date(),
        } satisfies ResetTokenDocument),
      });
      mockedDb.collection.mockReturnValue(col);

      await expect(validateResetToken("consumed-token")).rejects.toThrow(/used|consumed/i);
    });

    it("returns userId for a valid unexpired unconsumed token", async () => {
      const col = makeCollection({
        findOne: jest.fn().mockResolvedValue({
          userId: "user-42",
          tokenHash: "some-hash",
          expiresAt: new Date(Date.now() + 60_000),
          createdAt: new Date(),
        } satisfies ResetTokenDocument),
      });
      mockedDb.collection.mockReturnValue(col);

      const userId = await validateResetToken("valid-token");
      expect(userId).toBe("user-42");
    });
  });

  describe("consumeResetToken", () => {
    it("sets consumedAt on the document", async () => {
      const col = makeCollection();
      mockedDb.collection.mockReturnValue(col);

      await consumeResetToken("some-hash");
      expect(col.updateOne).toHaveBeenCalledWith(
        { tokenHash: "some-hash" },
        { $set: { consumedAt: expect.any(Date) } }
      );
    });
  });
});
