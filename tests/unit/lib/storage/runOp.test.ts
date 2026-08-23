/**
 * @jest-environment node
 */

import { runStorageOp } from "@/lib/storage/runOp";
import { StorageError } from "@/lib/storage/errors";
import * as logger from "@/lib/telemetry/logger";

describe("runStorageOp", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(logger, "logStorageEvent").mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("single-record lookup finding nothing resolves to null and logs not_found", async () => {
    const fn = jest.fn().mockResolvedValue(null);

    const result = await runStorageOp(
      { name: "getMember", collection: "campaignMembers", isEmpty: (r) => r === null },
      fn,
    );

    expect(result).toBeNull();
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "getMember",
        collection: "campaignMembers",
        outcome: "not_found",
      }),
    );
  });

  test("list query finding nothing resolves to [] and logs success (no classifier)", async () => {
    const fn = jest.fn().mockResolvedValue([]);

    const result = await runStorageOp(
      { name: "listCharacters", collection: "characters" },
      fn,
    );

    expect(result).toEqual([]);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "success" }),
    );
  });

  test("non-empty success result is returned unmodified and logs success", async () => {
    const value = { id: "abc" };
    const fn = jest.fn().mockResolvedValue(value);

    const result = await runStorageOp(
      { name: "loadCampaignById", collection: "campaigns", isEmpty: (r) => r === null },
      fn,
    );

    expect(result).toBe(value);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "success" }),
    );
  });

  test("wrapped operation throwing rejects with StorageError and logs error", async () => {
    const originalError = new Error("connection refused");
    const fn = jest.fn().mockRejectedValue(originalError);

    await expect(
      runStorageOp({ name: "loadSpellById", collection: "spellTemplates" }, fn),
    ).rejects.toBeInstanceOf(StorageError);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "loadSpellById",
        collection: "spellTemplates",
        outcome: "error",
        error: originalError,
      }),
    );
  });

  test("failure occurs regardless of an isEmpty classifier being present", async () => {
    const originalError = new Error("boom");
    const isEmpty = jest.fn();
    const fn = jest.fn().mockRejectedValue(originalError);

    await expect(
      runStorageOp({ name: "getMember", collection: "campaignMembers", isEmpty }, fn),
    ).rejects.toBeInstanceOf(StorageError);

    expect(isEmpty).not.toHaveBeenCalled();
  });

  test("thrown StorageError op/collection correlate with the logged event", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("boom"));

    let caught: unknown;
    try {
      await runStorageOp({ name: "loadSpellById", collection: "spellTemplates" }, fn);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(StorageError);
    const storageError = caught as StorageError;
    const [loggedEvent] = logSpy.mock.calls[0];
    expect(storageError.op).toBe(loggedEvent.name);
    expect(storageError.collection).toBe(loggedEvent.collection);
  });

  test("a throwing isEmpty classifier is not caught and reported as a storage error", async () => {
    const value = { id: "abc" };
    const fn = jest.fn().mockResolvedValue(value);
    const classifierError = new Error("bad classifier");
    const isEmpty = jest.fn(() => {
      throw classifierError;
    });

    await expect(
      runStorageOp({ name: "loadCampaignById", collection: "campaigns", isEmpty }, fn),
    ).rejects.toBe(classifierError);

    expect(logSpy).not.toHaveBeenCalled();
  });

  test("durationMs is >= 0 and captured for success and error outcomes", async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const successFn = jest.fn(async () => {
      await delay(5);
      return "ok";
    });
    await runStorageOp({ name: "loadCampaignById", collection: "campaigns" }, successFn);
    const [successEvent] = logSpy.mock.calls[0];
    expect(successEvent.durationMs).toBeGreaterThanOrEqual(0);

    logSpy.mockClear();

    const errorFn = jest.fn(async () => {
      await delay(5);
      throw new Error("boom");
    });
    await expect(
      runStorageOp({ name: "loadSpellById", collection: "spellTemplates" }, errorFn),
    ).rejects.toBeInstanceOf(StorageError);
    const [errorEvent] = logSpy.mock.calls[0];
    expect(errorEvent.durationMs).toBeGreaterThanOrEqual(0);
  });
});
