import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { createMockClient, createTestCreature, createTestSpell } from "./testHelpers";
import type { IOpen5EClient } from "@/lib/import/open5eAdapter";
import type { ImportResult } from "@/lib/import/dedupeEngine";
import type { Db } from "mongodb";

describe("dedupeEngine integration", () => {
  let mongoContainer: StartedMongoDBContainer;
  let mongoUri: string;
  let importMonstersFromOpen5E: (client: IOpen5EClient) => Promise<ImportResult>;
  let importSpellsFromOpen5E: (client: IOpen5EClient) => Promise<ImportResult>;
  let getDatabase: () => Promise<Db>;
  let closeDatabase: () => Promise<void>;
  let db: Db;

  beforeAll(async () => {
    jest.resetModules();
    mongoContainer = await new MongoDBContainer("mongo:8").withExposedPorts(27017).start();
    mongoUri = `${mongoContainer.getConnectionString()}/?directConnection=true`;
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_DB = "session-combat-test";
    
    const engineMod = await import("@/lib/import/dedupeEngine");
    importMonstersFromOpen5E = engineMod.importMonstersFromOpen5E;
    importSpellsFromOpen5E = engineMod.importSpellsFromOpen5E;

    const dbMod = await import("@/lib/db");
    getDatabase = dbMod.getDatabase;
    closeDatabase = dbMod.closeDatabase;
    
    db = await getDatabase();
  }, 120000);

  afterAll(async () => {
    if (closeDatabase) {
      await closeDatabase();
    }
    await mongoContainer.stop();
  }, 30000);

  beforeEach(async () => {
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

      const count = await db.collection("monsterTemplates").countDocuments({});
      expect(count).toBe(0);
    });

    it("handles multiple calls with same client (fresh generators)", async () => {
      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      // First call consumes generator
      const result1 = await importMonstersFromOpen5E(client);
      expect(result1.inserted).toBe(1);

      // Second call should get a fresh generator and find the duplicate
      const result2 = await importMonstersFromOpen5E(client);
      expect(result2.inserted).toBe(0);
      expect(result2.skipped).toBe(1);
    });
  });

  describe("importSpellsFromOpen5E", () => {
    it("inserts spell when not duplicate and valid", async () => {
      const spell = createTestSpell({ key: "fireball", name: "Fireball" });
      const client = createMockClient([], [spell]);

      const result = await importSpellsFromOpen5E(client);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      const found = await db.collection("spellTemplates").findOne({ name: "Fireball", source: "open5e" });
      expect(found).not.toBeNull();
      expect(found?.name).toBe("Fireball");
    });

    it("skips spell when it already exists", async () => {
      const spell = createTestSpell({ key: "fireball", name: "Fireball" });

      await importSpellsFromOpen5E(createMockClient([], [spell]));
      
      const result = await importSpellsFromOpen5E(createMockClient([], [spell]));
      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it("handles multiple calls with same client (fresh generators)", async () => {
      const spell = createTestSpell({ key: "fireball", name: "Fireball" });
      const client = createMockClient([], [spell]);

      await importSpellsFromOpen5E(client);
      const result2 = await importSpellsFromOpen5E(client);
      
      expect(result2.inserted).toBe(0);
      expect(result2.skipped).toBe(1);
    });
  });
});