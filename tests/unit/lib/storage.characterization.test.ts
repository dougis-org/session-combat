/**
 * @jest-environment node
 *
 * Characterization tests pinning current, observable error-handling behavior
 * for three `storage.*` methods identified in #500 as inconsistent-by-design:
 * `loadSpellById` (swallow), `getMember` (rethrow), and `loadCharacters`
 * (mixed, two-tier view+fallback). See docs/storage-refactor/plan.md and
 * docs/storage-refactor/inventory.json for the full taxonomy and inventory
 * these tests support.
 *
 * IMPORTANT: these tests pin CURRENT behavior, including known
 * inconsistencies (e.g. loadSpellById's DB-error/not-found ambiguity). They
 * are not an assertion that this behavior is correct or desirable. #499's
 * `runStorageOp` milestone is where that behavior may be intentionally
 * changed — do not "fix" these tests without updating that epic's scope.
 */
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedGetDatabase = jest.mocked(getDatabase);

function makeMockCollection() {
  const toArray = jest.fn();
  const find = jest.fn(() => ({ toArray }));
  const findOne = jest.fn();
  return { find, toArray, findOne };
}

describe("storage.loadSpellById (behavior: swallow)", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  // These two tests pin the current DB-error/not-found ambiguity as a known
  // characteristic of loadSpellById, not a design goal: a rejected findOne
  // (DB error) and a resolved-null findOne (genuine not-found) are currently
  // indistinguishable to callers, both producing `null`. See #499, which is
  // where this ambiguity may eventually be resolved by giving these two
  // cases distinct observable outcomes.
  it("resolves to null when the underlying DB call rejects", async () => {
    mockCollection.findOne.mockRejectedValue(new Error("connection reset"));

    await expect(storage.loadSpellById("spell-123")).resolves.toBeNull();
  });

  it("resolves to null when the underlying DB call finds no matching document", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    await expect(storage.loadSpellById("spell-123")).resolves.toBeNull();
  });
});

describe("storage.getMember (behavior: rethrow → StorageError after #503)", () => {
  let mockCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = makeMockCollection();
    mockDb = { collection: jest.fn(() => mockCollection) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  // Behavior change (#503): getMember previously re-threw the raw driver
  // error. It now rejects with a StorageError wrapping it as `cause`, so
  // assertCampaignAccess surfaces a DB outage as a 500 rather than masking it.
  it("rejects with StorageError (original error as cause) when the DB call rejects", async () => {
    const dbError = new Error("connection reset");
    mockCollection.findOne.mockRejectedValue(dbError);

    await expect(storage.getMember("camp-1", "user-1")).rejects.toMatchObject({
      message: expect.stringContaining('Storage operation "getMember" failed'),
      cause: dbError,
    });
  });
});

describe("storage.loadCharacters (behavior: mixed)", () => {
  let mockActiveCollection: ReturnType<typeof makeMockCollection>;
  let mockFallbackCollection: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: jest.Mock };

  const VIEW_RESULT = [{ id: "char-view", userId: "user-1", name: "From view" }];
  const FALLBACK_RESULT = [{ id: "char-fallback", userId: "user-1", name: "From fallback" }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveCollection = makeMockCollection();
    mockFallbackCollection = makeMockCollection();
    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === "characters_active") return mockActiveCollection;
        if (name === "characters") return mockFallbackCollection;
        throw new Error(`unexpected collection name: ${name}`);
      }),
    };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  it("returns the view's results when the characters_active view query succeeds", async () => {
    mockActiveCollection.toArray.mockResolvedValue(VIEW_RESULT);

    const result = await storage.loadCharacters("user-1");

    expect(result.map((c) => c.id)).toEqual(["char-view"]);
    expect(mockFallbackCollection.find).not.toHaveBeenCalled();
  });

  // Proves the fallback path actually runs (not just that some result came
  // back) by asserting the returned data matches the fallback collection's
  // distinct mock data, not the view's.
  it("falls back to the characters collection when the view query rejects", async () => {
    mockActiveCollection.toArray.mockRejectedValue(new Error("view unavailable"));
    mockFallbackCollection.toArray.mockResolvedValue(FALLBACK_RESULT);

    const result = await storage.loadCharacters("user-1");

    expect(result.map((c) => c.id)).toEqual(["char-fallback"]);
    expect(mockFallbackCollection.find).toHaveBeenCalledWith({
      userId: "user-1",
      deletedAt: null,
    });
  });

  // Proves the outer swallow catches the fallback's failure too, not just
  // the view's — the double-failure case resolves to [] rather than
  // rejecting.
  it("throws StorageError when both the view query and the fallback query reject", async () => {
    mockActiveCollection.toArray.mockRejectedValue(new Error("view unavailable"));
    mockFallbackCollection.toArray.mockRejectedValue(new Error("fallback also unavailable"));

    await expect(storage.loadCharacters("user-1")).rejects.toThrow("Storage operation \"loadCharacters\" failed");
  });
});
