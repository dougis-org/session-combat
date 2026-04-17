import { MongoClient, ObjectId } from "mongodb";
import { startTestServer, registerAndGetCookie, TestServer } from "./helpers/server";

describe("isUserAdmin Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;
  let mongoClient: MongoClient;
  let isUserAdmin: (userId: string) => Promise<boolean | null>;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;

    // Must follow startTestServer() so MONGODB_URI is set before the module-level constant runs
    jest.resetModules();
    const mod = await import("@/lib/permissions");
    isUserAdmin = mod.isUserAdmin;

    mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
  }, 120000);

  afterAll(async () => {
    await mongoClient.close();
    await server.cleanup();
  }, 30000);

  async function registerUser(emailSuffix: string): Promise<{ userId: string }> {
    const email = `permissions-test-${emailSuffix}-${Date.now()}@example.com`;
    await registerAndGetCookie(baseUrl, email, "TestPassword123!");

    const db = mongoClient.db(process.env.MONGODB_DB);
    const user = await db.collection("users").findOne({ email });
    if (!user) throw new Error(`User not found after registration: ${email}`);

    return { userId: user._id.toString() };
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
