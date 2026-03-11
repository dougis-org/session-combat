/** @jest-environment jsdom */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { SESSION_COMBAT_PREFIX } from "@/lib/offline/LocalStore";
import { SyncQueue } from "@/lib/offline/SyncQueue";

describe("SyncQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("enqueue() adds an operation with attempts: 0", () => {
    const operation = SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });

    expect(operation).not.toBeNull();
    expect(operation?.attempts).toBe(0);
    expect(SyncQueue.getAll()).toHaveLength(1);
  });

  test("queue persists to sessionCombat:v1:syncQueue key", () => {
    SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });

    const raw = localStorage.getItem(`${SESSION_COMBAT_PREFIX}syncQueue`);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string) as Array<{ entity: string }>;
    expect(parsed[0].entity).toBe("encounters");
  });

  test("markFailed() sets nextRetryAt about 1000ms out for attempts: 0", () => {
    const start = 1_000_000;
    jest.spyOn(Date, "now").mockReturnValue(start);

    const op = SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });

    expect(op).not.toBeNull();
    SyncQueue.markFailed((op as { id: string }).id);

    const updated = SyncQueue.getAll()[0];
    expect(updated.attempts).toBe(1);
    expect(updated.nextRetryAt).toBe(start + 1000);
  });

  test("markFailed() caps nextRetryAt at 30000ms for high attempts", () => {
    const start = 2_000_000;
    jest.spyOn(Date, "now").mockReturnValue(start);

    const seed = [
      {
        id: "op-1",
        entity: "encounters",
        action: "upsert",
        payload: { id: "enc-1" },
        createdAt: new Date(start).toISOString(),
        attempts: 5,
        nextRetryAt: start,
      },
    ];

    localStorage.setItem(
      `${SESSION_COMBAT_PREFIX}syncQueue`,
      JSON.stringify(seed),
    );

    SyncQueue.markFailed("op-1");

    const updated = SyncQueue.getAll()[0];
    expect(updated.attempts).toBe(6);
    expect(updated.nextRetryAt).toBe(start + 30000);
  });

  test("clear() empties the queue", () => {
    SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });

    SyncQueue.clear();

    expect(SyncQueue.getAll()).toEqual([]);
  });

  test("clear() is safe when queue is empty", () => {
    expect(() => SyncQueue.clear()).not.toThrow();
  });

  test("flush() removes successful operations and retains failed ones", async () => {
    const op1 = SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });
    const op2 = SyncQueue.enqueue({
      entity: "parties",
      action: "upsert",
      payload: { id: "party-1" },
    });

    const syncFn = jest.fn(async (operation: { id: string }) => {
      if (operation.id === op2?.id) {
        throw new Error("sync failed");
      }
    });

    await SyncQueue.flush(syncFn);

    const remaining = SyncQueue.getAll();
    expect(syncFn).toHaveBeenCalledTimes(2);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(op2?.id);
    expect(remaining[0].attempts).toBe(1);
    expect(remaining[0].id).not.toBe(op1?.id);
  });

  test("online event triggers an automatic flush call", async () => {
    const op = SyncQueue.enqueue({
      entity: "encounters",
      action: "upsert",
      payload: { id: "enc-1" },
    });

    const syncFn: jest.MockedFunction<(operation: unknown) => Promise<void>> =
      jest
        .fn<(_operation: unknown) => Promise<void>>()
        .mockRejectedValueOnce(new Error("first failure"))
        .mockResolvedValueOnce(undefined);

    await SyncQueue.flush(syncFn);

    const queue = SyncQueue.getAll();
    queue[0].nextRetryAt = 0;
    localStorage.setItem(
      `${SESSION_COMBAT_PREFIX}syncQueue`,
      JSON.stringify(queue),
    );

    window.dispatchEvent(new Event("online"));
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(2);
    expect(SyncQueue.getAll()).toEqual([]);
    expect(op).not.toBeNull();
  });
});
