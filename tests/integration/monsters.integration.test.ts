import fetch from "node-fetch";
import { startTestServer, registerAndGetCookie, TestServer } from "./helpers/server";

interface MonsterResponse {
  id: string;
  userId: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  abilityScores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: string;
}

describe("Monster API Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;
  let authCookie: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;

    const email = `monster-test-${Date.now()}@example.com`;
    authCookie = await registerAndGetCookie(baseUrl, email, "testPassword123!");
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  function authed() {
    return { "Content-Type": "application/json", Cookie: authCookie };
  }

  it("should return healthy status from health endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("should return 401 for unauthenticated monster requests", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status).toBe(401);
  });

  it("should POST a monster template and return 201", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Goblin",
        hp: 7,
        maxHp: 7,
        ac: 15,
      }),
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as MonsterResponse;
    expect(data.name).toBe("Goblin");
    expect(data.hp).toBe(7);
    expect(data.maxHp).toBe(7);
    expect(data.ac).toBe(15);
    expect(data.abilityScores).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it("should return 400 when creating monster without name", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ hp: 7, maxHp: 7, ac: 15 }),
    });
    expect(response.status).toBe(400);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toContain("name");
  });

  it("should return 400 when maxHp is 0 or negative", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Invalid Monster",
        hp: 7,
        maxHp: 0,
        ac: 15,
      }),
    });
    expect(response.status).toBe(400);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toContain("Max HP");
  });

  it("should cap hp to maxHp when hp exceeds maxHp", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Over HP Monster",
        hp: 20,
        maxHp: 10,
        ac: 15,
      }),
    });
    expect(response.status).toBe(201);
    const data = (await response.json()) as MonsterResponse;
    expect(data.maxHp).toBe(10);
    expect(data.hp).toBe(10);
  });

  it("should use default values for optional fields", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Minimal Monster", maxHp: 10 }),
    });
    expect(response.status).toBe(201);
    const data = (await response.json()) as MonsterResponse;
    expect(data.name).toBe("Minimal Monster");
    expect(data.maxHp).toBe(10);
    expect(data.ac).toBe(10); // default
    expect(data.hp).toBe(10); // hp defaults to maxHp
    expect(data.abilityScores).toBeDefined();
  });

  it("should return 404 when trying to GET non-existent monster", async () => {
    const response = await fetch(`${baseUrl}/api/monsters/nonexistent-id`, {
      headers: authed(),
    });
    expect(response.status).toBe(404);
  });

  it("should return 404 when trying to DELETE non-existent monster", async () => {
    const response = await fetch(`${baseUrl}/api/monsters/nonexistent-id`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(response.status).toBe(404);
  });

  it("should return 404 when trying to PUT non-existent monster", async () => {
    const response = await fetch(`${baseUrl}/api/monsters/nonexistent-id`, {
      method: "PUT",
      headers: authed(),
      body: JSON.stringify({
        name: "Updated Monster",
        hp: 10,
        maxHp: 20,
        ac: 16,
        initiativeBonus: 3,
        dexterity: 14,
      }),
    });
    expect(response.status).toBe(404);
  });

  it("should GET all monsters for authenticated user", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      headers: authed(),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
