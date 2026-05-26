import { MongoClient, ObjectId } from "mongodb";
import { registerTestUser } from "./helpers/users";

describe("isUserAdmin Integration Tests", () => {
  let baseUrl: string;
  let mongoClient: MongoClient;
  let isUserAdmin: (userId: string) => Promise<boolean | null>;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    jest.resetModules();
    const mod = await import("@/lib/permissions");
    isUserAdmin = mod.isUserAdmin;

    mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
  }, 30000);

  afterAll(async () => {
    await mongoClient.close();
  }, 30000);

  async function registerUser(emailSuffix: string): Promise<{ userId: string }> {
    const { userId } = await registerTestUser(baseUrl, `permissions-${emailSuffix}`);
    return { userId };
  }

  it("returns true for admin user", async () => {
    const { userId } = await registerUser("admin");

    const db = mongoClient.db(process.env.MONGODB_DB);
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isAdmin: true } }
    );

    const result = await isUserAdmin(userId);
    expect(result).toBe(true);
  });

  it("returns false for non-admin user", async () => {
    const { userId } = await registerUser("nonadmin");
    const result = await isUserAdmin(userId);
    expect(result).toBe(false);
  });

  it("returns false for unknown userId", async () => {
    const unknownId = new ObjectId().toString();
    const result = await isUserAdmin(unknownId);
    expect(result).toBe(false);
  });

  it("returns null for malformed userId", async () => {
    const result = await isUserAdmin("not-a-valid-object-id");
    expect(result).toBeNull();
  });
});
