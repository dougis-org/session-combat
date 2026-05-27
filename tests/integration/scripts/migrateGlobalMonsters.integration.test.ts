import { MongoClient, Collection } from "mongodb";
import { migrateGlobalMonsters } from "../../../lib/scripts/migrateGlobalMonsters";
import { GLOBAL_USER_ID } from "../../../lib/constants";

const TEST_MARKER_FIELD = "__migrateTestRun";
const TEST_MARKER_VALUE = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let client: MongoClient;
let collection: Collection;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI!;
  const db = process.env.MONGODB_DB!;
  if (!uri || !db) throw new Error("MONGODB_URI and MONGODB_DB must be set");
  client = new MongoClient(uri);
  await client.connect();
  collection = client.db(db).collection("monsterTemplates");
});

afterAll(async () => {
  await client.close();
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
  it("tags a global monster with no source field", async () => {
    const { insertedId } = await seed({
      userId: GLOBAL_USER_ID,
      isGlobal: true,
    });

    await migrateGlobalMonsters();

    const doc = await collection.findOne({ _id: insertedId });
    expect(doc?.source).toBe("SRD");
  });

  it("tags a global monster with empty source string", async () => {
    const { insertedId } = await seed({
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      source: "",
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
