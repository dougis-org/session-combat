/**
 * @jest-environment node
 */

import { StorageError } from "@/lib/storage/errors";

describe("StorageError", () => {
  test("exposes cause, op, and collection", () => {
    const originalError = new Error("connection refused");

    const error = new StorageError("loadSpellById", "spellTemplates", {
      cause: originalError,
    });

    expect(error.cause).toBe(originalError);
    expect(error.op).toBe("loadSpellById");
    expect(error.collection).toBe("spellTemplates");
  });

  test("is an Error with name StorageError", () => {
    const error = new StorageError("getMember", "campaignMembers", {
      cause: new Error("boom"),
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("StorageError");
  });

  test("message includes op and collection", () => {
    const error = new StorageError("loadSpellById", "spellTemplates", {
      cause: new Error("boom"),
    });

    expect(error.message).toContain("loadSpellById");
    expect(error.message).toContain("spellTemplates");
  });
});
