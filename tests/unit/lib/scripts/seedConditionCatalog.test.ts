/**
 * @jest-environment node
 */
import { seedConditionCatalog } from "@/lib/scripts/seedConditionCatalog";
import { CONDITION_CATALOG } from "@/lib/data/conditionCatalog";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import { getDatabase } from "@/lib/db";

function mockCollection() {
  const store = new Map<string, { name: string; description: string }>();
  const collection = {
    findOne: jest.fn(async ({ name }: { name: string }) => store.get(name) ?? null),
    updateOne: jest.fn(async ({ name }: { name: string }, { $set }: { $set: { name: string; description: string } }) => {
      store.set(name, $set);
    }),
  };
  jest.mocked(getDatabase).mockResolvedValue({
    collection: jest.fn().mockReturnValue(collection),
  } as never);
  return { collection, store };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("seedConditionCatalog", () => {
  it("inserts exactly 18 entries into an empty collection", async () => {
    const { store } = mockCollection();
    const result = await seedConditionCatalog();
    expect(store.size).toBe(18);
    expect(result.inserted).toBe(18);
    expect(result.updated).toBe(0);
  });

  it("is idempotent: running twice still results in exactly 18 entries", async () => {
    const { store } = mockCollection();
    await seedConditionCatalog();
    const second = await seedConditionCatalog();
    expect(store.size).toBe(18);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(18);
  });

  it("every seeded entry has a non-empty name and description", () => {
    expect(CONDITION_CATALOG).toHaveLength(18);
    for (const entry of CONDITION_CATALOG) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it("includes Slowed, Confused, and Turned", () => {
    expect(CONDITION_CATALOG.map((c) => c.name)).toEqual(
      expect.arrayContaining(["Slowed", "Confused", "Turned"])
    );
  });
});
