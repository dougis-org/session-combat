import { MongoClient } from "mongodb";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

describe("Username Backfill Script Integration Tests", () => {
  let mongoUri: string;
  let dbName: string;
  let client: MongoClient;
  const scriptPath = path.join(process.cwd(), "scripts", "backfill-usernames.ts");

  beforeAll(async () => {
    mongoUri = process.env.MONGODB_URI!;
    dbName = "session-combat-test-backfill";
    if (!mongoUri) throw new Error("MONGODB_URI not set");

    client = new MongoClient(mongoUri);
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    const db = client.db(dbName);
    await db.collection("users").deleteMany({});
  });

  it("should successfully backfill users without a username and derive from email local-part", async () => {
    const db = client.db(dbName);
    
    // Seed users without username
    await db.collection("users").insertMany([
      {
        email: "doug@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "alice@another.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // Run backfill script via tsx
    const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath}`, {
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        MONGODB_DB: dbName,
      },
    });

    expect(stdout).toContain("Assigned username \"doug\" to user doug@example.com");
    expect(stdout).toContain("Assigned username \"alice\" to user alice@another.com");
    expect(stdout).toContain("2 users updated");

    // Verify database state
    const users = await db.collection("users").find({}).toArray();
    expect(users).toHaveLength(2);
    
    const doug = users.find(u => u.email === "doug@example.com");
    expect(doug?.username).toBe("doug");

    const alice = users.find(u => u.email === "alice@another.com");
    expect(alice?.username).toBe("alice");
  });

  it("should de-duplicate email local-part collisions with -2/-3 suffix", async () => {
    const db = client.db(dbName);

    // Seed users that will collide on email local-part
    await db.collection("users").insertMany([
      {
        email: "foo@company-a.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "foo@company-b.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "foo@company-c.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // Run backfill script
    const { stdout } = await execAsync(`npx tsx ${scriptPath}`, {
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        MONGODB_DB: dbName,
      },
    });

    expect(stdout).toContain("3 users updated");

    // Verify database state
    const users = await db.collection("users").find({}).toArray();
    const usernames = users.map(u => u.username).sort();
    expect(usernames).toEqual(["foo", "foo-2", "foo-3"]);
  });

  it("should not overwrite already-assigned usernames", async () => {
    const db = client.db(dbName);

    await db.collection("users").insertMany([
      {
        email: "doug@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        username: "existing-doug",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "alice@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    const { stdout } = await execAsync(`npx tsx ${scriptPath}`, {
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        MONGODB_DB: dbName,
      },
    });

    expect(stdout).toContain("Assigned username \"alice\" to user alice@example.com");
    expect(stdout).not.toContain("Assigned username \"doug\" to user doug@example.com");
    expect(stdout).toContain("1 users updated");

    const users = await db.collection("users").find({}).toArray();
    const doug = users.find(u => u.email === "doug@example.com");
    expect(doug?.username).toBe("existing-doug"); // Unchanged
  });

  it("should be idempotent and make no modifications on a second run", async () => {
    const db = client.db(dbName);

    await db.collection("users").insertMany([
      {
        email: "doug@example.com",
        passwordHash: "hash",
        tokenVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // First run
    await execAsync(`npx tsx ${scriptPath}`, {
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        MONGODB_DB: dbName,
      },
    });

    // Second run
    const { stdout } = await execAsync(`npx tsx ${scriptPath}`, {
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        MONGODB_DB: dbName,
      },
    });

    expect(stdout).toContain("0 users updated");
  });
});
