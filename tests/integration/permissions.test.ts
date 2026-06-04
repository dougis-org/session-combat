import { ObjectId } from "mongodb";
import { registerTestUser, makeUserAdmin } from "./helpers/users";

describe("isUserAdmin Integration Tests", () => {
  let baseUrl: string;
  let isUserAdmin: (userId: string) => Promise<boolean | null>;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    jest.resetModules();
    const mod = await import("@/lib/permissions");
    isUserAdmin = mod.isUserAdmin;
  }, 30000);

  afterAll(async () => {
    // No MongoClient to close
  }, 30000);

  async function registerUser(emailSuffix: string): Promise<{ userId: string }> {
    const { userId } = await registerTestUser(baseUrl, `permissions-${emailSuffix}`);
    return { userId };
  }

  it("returns true for admin user", async () => {
    const { userId } = await registerUser("admin");

    await makeUserAdmin(userId);

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

  it("fails to promote non-existent user to admin", async () => {
    const fakeId = new ObjectId().toString();
    await expect(makeUserAdmin(fakeId)).rejects.toThrow(
      `Failed to promote user to admin: user ${fakeId} not found`
    );
  });

  it("fails to promote malformed userId to admin", async () => {
    const malformedId = "not-a-valid-object-id";
    await expect(makeUserAdmin(malformedId)).rejects.toThrow(
      `Failed to promote user to admin: invalid userId format "${malformedId}"`
    );
  });
});
