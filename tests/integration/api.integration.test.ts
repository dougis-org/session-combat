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
});
