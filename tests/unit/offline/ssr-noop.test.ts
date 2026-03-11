/** @jest-environment node */

describe("offline modules SSR behavior", () => {
  test("LocalStore set/get are safe in SSR", async () => {
    const { LocalStore } = await import("@/lib/offline/LocalStore");

    expect(() => LocalStore.set("encounters", [{ id: "enc-1" }])).not.toThrow();
    expect(LocalStore.get("encounters")).toBeNull();
  });

  test("SyncQueue enqueue is safe in SSR", async () => {
    const { SyncQueue } = await import("@/lib/offline/SyncQueue");

    expect(() =>
      SyncQueue.enqueue({
        entity: "encounters",
        action: "upsert",
        payload: { id: "enc-1" },
      }),
    ).not.toThrow();
    expect(SyncQueue.getAll()).toEqual([]);
  });

  test("NetworkDetector isOnline returns true in SSR", async () => {
    const { NetworkDetector } = await import("@/lib/offline/NetworkDetector");

    expect(NetworkDetector.isOnline()).toBe(true);
  });
});
