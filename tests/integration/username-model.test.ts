process.env.MONGODB_DB = "session-combat-test-username-model";

import { MongoClient, Collection } from "mongodb";
import { User } from "@/lib/types";
import { connectToDatabase, closeDatabase } from "@/lib/db";

describe("User Model & Index Integration Tests", () => {
  let mongoUri: string;
  let dbName: string;
  let client: MongoClient;

  beforeAll(async () => {
    mongoUri = process.env.MONGODB_URI!;
    dbName = "session-combat-test-username-model";
    process.env.MONGODB_DB = dbName;
    if (!mongoUri) throw new Error("MONGODB_URI not set");
    
    // Clear connection cache first
    await closeDatabase();
    
    client = new MongoClient(mongoUri);
    await client.connect();
    
    // Call connectToDatabase to trigger initializeDatabase and create indexes
    await connectToDatabase();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    const db = client.db(dbName);
    await db.collection("users").deleteMany({});
  });

  describe("Task 1 — User Type Compilation Checks", () => {
    it("should compile a User object with username", () => {
      const userWithUsername: User = {
        email: "alice@example.com",
        passwordHash: "hash123",
        tokenVersion: 1,
        username: "alice",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(userWithUsername.username).toBe("alice");
    });

    it("should compile a User object without username", () => {
      const userWithoutUsername: User = {
        email: "bob@example.com",
        passwordHash: "hash123",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(userWithoutUsername.username).toBeUndefined();
    });
  });

  describe("Task 2 — Sparse Unique Index on users.username", () => {
    it("should allow two case-distinct usernames to coexist", async () => {
      const db = client.db(dbName);
      
      const user1 = {
        email: "alice1@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        username: "Alice",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user2 = {
        email: "alice2@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        username: "alice",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("users").insertOne(user1);
      await expect(db.collection("users").insertOne(user2)).resolves.toBeDefined();
    });

    it("should reject duplicate usernames with code 11000", async () => {
      const db = client.db(dbName);

      const user1 = {
        email: "doug1@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        username: "doug",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user2 = {
        email: "doug2@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        username: "doug",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("users").insertOne(user1);
      
      let error: any;
      try {
        await db.collection("users").insertOne(user2);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });

    it("should allow documents without a username field to coexist without conflict", async () => {
      const db = client.db(dbName);

      const user1 = {
        email: "user1@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user2 = {
        email: "user2@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("users").insertOne(user1);
      await expect(db.collection("users").insertOne(user2)).resolves.toBeDefined();
    });

    it("should handle index creation failure gracefully (non-fatal)", async () => {
      // Clear connection cache first
      await closeDatabase();

      const originalCreateIndex = Collection.prototype.createIndex;
      const createIndexMock = jest.fn().mockImplementation(function (
        this: Collection,
        keys: any,
        options: any
      ) {
        if (this.collectionName === "users" && keys.username) {
          throw new Error("Simulated username index failure");
        }
        return originalCreateIndex.call(this, keys, options);
      });

      Collection.prototype.createIndex = createIndexMock;

      try {
        // Calling connectToDatabase should execute initializeDatabase and catch the error internally
        await expect(connectToDatabase()).resolves.toBeDefined();
      } finally {
        Collection.prototype.createIndex = originalCreateIndex;
        await closeDatabase();
      }
    });
  });
});
