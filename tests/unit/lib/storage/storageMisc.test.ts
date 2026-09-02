/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/storageMisc";
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

describe("storageMisc.clear", () => {
  it("issues deleteMany({ userId }) across every scoped collection", async () => {
    const col = mockCollection();
    await repo.clear("u1");
    expect(col.deleteMany).toHaveBeenCalledTimes(7);
    expect(col.deleteMany).toHaveBeenCalledWith({ userId: "u1" });
    expectLoggedOutcome(getLogSpy(), "success");
  });

  it("rejects with StorageError (op 'clear') and logs one error event when a deleteMany fails", async () => {
    mockCollection({ deleteMany: new Error("db down") });
    await expectStorageError(repo.clear("u1"), { op: "clear", collection: "storageMisc" });
    expectLoggedOutcome(getLogSpy(), "error");
  });

  it("is exposed on the storage facade; storage.load is gone", () => {
    expectFacadeMethods(storage as Record<string, unknown>, ["clear"]);
    expect((storage as Record<string, unknown>).load).toBeUndefined();
  });
});
