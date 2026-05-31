import fetch from "node-fetch";
import { registerTestUser } from "./helpers/users";
import { createTestEmail } from "@/tests/integration/auth.test.helpers";

describe("API Integration Tests", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  });

  it("should return healthy status from health endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("should require authentication for protected endpoints", async () => {
    const response = await fetch(`${baseUrl}/api/characters`);
    expect(response.status).toBe(401);
  });

  it("should allow registration of new users", async () => {
    const email = createTestEmail("test");
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "testPassword123!", username: "regtestuser" }),
    });
    expect(response.status).toBe(201);
  });

  it("should allow authenticated access to protected endpoints after registration", async () => {
    const { cookie } = await registerTestUser(baseUrl, "auth-test");

    const response = await fetch(`${baseUrl}/api/characters`, {
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(200);
  });

  it("should return empty parties list for a new user", async () => {
    const { cookie } = await registerTestUser(baseUrl, "parties-test");

    const response = await fetch(`${baseUrl}/api/parties`, {
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("should allow creating a party with characterIds and return it in subsequent GET", async () => {
    const { cookie } = await registerTestUser(baseUrl, "parties-crud");

    const createResponse = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "The Fellowship", characterIds: ["char-1", "char-2"] }),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json() as { id: string; name: string; members: Array<{ characterId: string }> };
    expect(created.name).toBe("The Fellowship");
    expect(created.members.map((m) => m.characterId)).toEqual(["char-1", "char-2"]);

    const listResponse = await fetch(`${baseUrl}/api/parties`, {
      headers: { Cookie: cookie },
    });
    expect(listResponse.status).toBe(200);
    const parties = await listResponse.json() as Array<{ id: string }>;
    expect(parties.some((p) => p.id === created.id)).toBe(true);
  });

  it("should require authentication for GET /api/parties", async () => {
    const response = await fetch(`${baseUrl}/api/parties`);
    expect(response.status).toBe(401);
  });
});
