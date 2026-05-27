import { Collection, Db } from "mongodb";
import { migrateGlobalMonsters } from "../../../lib/scripts/migrateGlobalMonsters";
import { GLOBAL_USER_ID } from "../../../lib/constants";
import { getDatabase, closeDatabase } from "../../../lib/db";

const TEST_MARKER_FIELD = "__migrateTestRun";
const TEST_MARKER_VALUE = `test-${Date.now()}-${require("crypto").randomBytes(3).toString("hex")}`;

let db: Db;
let collection: Collection;

beforeAll(async () => {
  db = await getDatabase();
  collection = db.collection("monsterTemplates");
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await collection.deleteMany({ [TEST_MARKER_FIELD]: TEST_MARKER_VALUE });
});

function seed(overrides: Record<string, unknown> = {}) {
  return collection.insertOne({
    [TEST_MARKER_FIELD]: TEST_MARKER_VALUE,
    ...overrides,
  });
}

describe("migrateGlobalMonsters", () => {
  it.each([
    ["no source field", {}],
    ["empty source string", { source: "" }],
  ])("tags a global monster with %s", async (_label, overrides) => {
    const { insertedId } = await seed({
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      ...overrides,
    });

    await migrateGlobalMonsters();

    const doc = await collection.findOne({ _id: insertedId });
    expect(doc?.source).toBe("SRD");
  });

  it("does not modify an already-tagged monster", async () => {
    const { insertedId } = await seed({
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      source: "SRD",
      updatedAt: new Date("2020-01-01"),
    });

    await migrateGlobalMonsters();

    const doc = await collection.findOne({ _id: insertedId });
    expect(doc?.updatedAt).toEqual(new Date("2020-01-01"));
  });

  it("does not touch non-global monsters", async () => {
    const { insertedId } = await seed({
      userId: GLOBAL_USER_ID,
      isGlobal: false,
    });

    await migrateGlobalMonsters();

    const doc = await collection.findOne({ _id: insertedId });
    expect(doc?.source).toBeUndefined();
  });

  it("returns modifiedCount equal to number of untagged docs", async () => {
    // Tag any pre-existing untagged global monsters so they don't skew the count
    await migrateGlobalMonsters();

    await seed({ userId: GLOBAL_USER_ID, isGlobal: true });
    await seed({ userId: GLOBAL_USER_ID, isGlobal: true, source: "" });
    await seed({ userId: GLOBAL_USER_ID, isGlobal: true, source: "SRD" });
    await seed({ userId: GLOBAL_USER_ID, isGlobal: false });

    const count = await migrateGlobalMonsters();
    expect(count).toBe(2);
  });

  it("is idempotent — second run returns 0", async () => {
    await seed({ userId: GLOBAL_USER_ID, isGlobal: true });

    await migrateGlobalMonsters();
    const count = await migrateGlobalMonsters();

    expect(count).toBe(0);
  });
});
