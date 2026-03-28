import fetch from "node-fetch";
import { startTestServer, registerAndGetCookie, TestServer } from "./helpers/server";

describe("API Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

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
    const email = `test-${Date.now()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "testPassword123!" }),
    });
    expect(response.status).toBe(201);
  });

  it("should allow authenticated access to protected endpoints after registration", async () => {
    const email = `auth-test-${Date.now()}@example.com`;
    const cookie = await registerAndGetCookie(baseUrl, email, "testPassword123!");

    const response = await fetch(`${baseUrl}/api/characters`, {
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(200);
  });

  it("should return empty parties list for a new user", async () => {
    const email = `parties-test-${Date.now()}@example.com`;
    const cookie = await registerAndGetCookie(baseUrl, email, "testPassword123!");

    const response = await fetch(`${baseUrl}/api/parties`, {
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("should allow creating a party with characterIds and return it in subsequent GET", async () => {
    const email = `parties-crud-${Date.now()}@example.com`;
    const cookie = await registerAndGetCookie(baseUrl, email, "testPassword123!");

    const createResponse = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "The Fellowship", characterIds: ["char-1", "char-2"] }),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json() as { id: string; name: string; characterIds: string[] };
    expect(created.name).toBe("The Fellowship");
    expect(created.characterIds).toEqual(["char-1", "char-2"]);

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
