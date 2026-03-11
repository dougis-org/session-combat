/** @jest-environment jsdom */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import {
  LocalStore,
  SESSION_COMBAT_PREFIX,
  StorageQuotaError,
} from "@/lib/offline/LocalStore";

describe("LocalStore", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("set() + get() round-trip", () => {
    const encounters = [{ id: "enc-1", name: "Goblin Cave" }];

    LocalStore.set("encounters", encounters);

    expect(LocalStore.get<typeof encounters>("encounters")).toEqual(encounters);
  });

  test("get() returns null for missing entity", () => {
    expect(LocalStore.get("missing")).toBeNull();
  });

  test("remove() deletes a single entity", () => {
    LocalStore.set("encounters", [{ id: "enc-1" }]);

    LocalStore.remove("encounters");

    expect(LocalStore.get("encounters")).toBeNull();
  });

  test("clear() removes sessionCombat:v1:* keys but not unrelated keys", () => {
    LocalStore.set("encounters", [{ id: "enc-1" }]);
    LocalStore.set("parties", [{ id: "party-1" }]);
    localStorage.setItem("unrelated", "keep-me");

    LocalStore.clear();

    expect(LocalStore.get("encounters")).toBeNull();
    expect(LocalStore.get("parties")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep-me");
  });

  test("clear() is safe when no keys exist", () => {
    expect(() => LocalStore.clear()).not.toThrow();
  });

  test("StorageQuotaError is thrown on quota exceeded", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const err = new Error("Quota reached");
      err.name = "QuotaExceededError";
      throw err;
    });

    expect(() => LocalStore.set("encounters", [{ id: "enc-1" }])).toThrow(
      StorageQuotaError,
    );
  });

  test("values are wrapped with version envelope", () => {
    LocalStore.set("encounters", [{ id: "enc-1" }]);

    const raw = localStorage.getItem(`${SESSION_COMBAT_PREFIX}encounters`);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string) as {
      v: number;
      data: unknown;
      updatedAt: string;
    };

    expect(parsed.v).toBe(1);
    expect(parsed.updatedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(parsed.data).toEqual([{ id: "enc-1" }]);
  });
});
