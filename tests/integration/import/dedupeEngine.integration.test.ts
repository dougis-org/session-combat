import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { createMockClient, createTestCreature } from "./testHelpers";

describe("dedupeEngine integration", () => {
  let mongoContainer: StartedMongoDBContainer;
  let mongoUri: string;
  let importMonstersFromOpen5E: (client: unknown) => Promise<{ inserted: number; skipped: number; errors: number }>;

  beforeAll(async () => {
    jest.resetModules();
    mongoContainer = await new MongoDBContainer("mongo:8").withExposedPorts(27017).start();
    mongoUri = `mongodb://localhost:${mongoContainer.getMappedPort(27017)}/?directConnection=true`;
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_DB = "session-combat-test";
    const mod = await import("@/lib/import/dedupeEngine");
    importMonstersFromOpen5E = mod.importMonstersFromOpen5E;
  }, 120000);

  afterAll(async () => {
    const { closeDatabase } = await import("@/lib/db");
    await closeDatabase();
    await mongoContainer.stop();
  }, 30000);

  beforeEach(async () => {
    const { getDatabase } = await import("@/lib/db");
    const db = await getDatabase();
    await db.collection("monsterTemplates").deleteMany({});
    await db.collection("spellTemplates").deleteMany({});
  });

  describe("importMonstersFromOpen5E", () => {
    it("inserts monster when not duplicate and valid", async () => {
      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      const { getDatabase } = await import("@/lib/db");
      const db = await getDatabase();
      const found = await db.collection("monsterTemplates").findOne({ name: "Goblin", source: "open5e" });
      expect(found).not.toBeNull();
      expect(found?.name).toBe("Goblin");
    });

    it("skips monster when it already exists", async () => {
      const creature = createTestCreature({ key: "goblin", name: "Goblin" });

      const result1 = await importMonstersFromOpen5E(createMockClient([creature], []));
      expect(result1.inserted).toBe(1);
      expect(result1.skipped).toBe(0);

      const result2 = await importMonstersFromOpen5E(createMockClient([creature], []));
      expect(result2.inserted).toBe(0);
      expect(result2.skipped).toBe(1);
      expect(result2.errors).toBe(0);

      const { getDatabase } = await import("@/lib/db");
      const db = await getDatabase();
      const count = await db.collection("monsterTemplates").countDocuments({ name: "Goblin", source: "open5e" });
      expect(count).toBe(1);
    });

    it("counts error when monster transform is invalid", async () => {
      const invalidCreature = createTestCreature({ name: "" });
      const client = createMockClient([invalidCreature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);

      const { getDatabase } = await import("@/lib/db");
      const db = await getDatabase();
      const count = await db.collection("monsterTemplates").countDocuments({});
      expect(count).toBe(0);
    });
  });
});