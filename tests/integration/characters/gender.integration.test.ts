import fetch from "node-fetch";
import { startTestServer, registerAndGetCookie, TestServer } from "../helpers/server";

describe("Character gender field — API integration", () => {
  let server: TestServer;
  let baseUrl: string;
  let cookie: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
    const email = `gender-test-${Date.now()}@example.com`;
    cookie = await registerAndGetCookie(baseUrl, email, "TestPassword123!");
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  it("creates a character with gender and returns it", async () => {
    const response = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Lyra", gender: "Female", classes: [{ class: "Wizard", level: 3 }] }),
    });
    expect(response.status).toBe(201);
    const character = await response.json() as { gender: string; name: string };
    expect(character.gender).toBe("Female");
  });

  it("trims whitespace from gender on create", async () => {
    const response = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Trimmed Hero", gender: "  Male  ", classes: [{ class: "Fighter", level: 1 }] }),
    });
    expect(response.status).toBe(201);
    const character = await response.json() as { gender: string };
    expect(character.gender).toBe("Male");
  });

  it("returns 400 when gender exceeds 50 characters on create", async () => {
    const longGender = "x".repeat(51);
    const response = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Long Gender Hero", gender: longGender, classes: [{ class: "Fighter", level: 1 }] }),
    });
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain("50");
  });

  it("returns 400 when gender is a non-string type on create", async () => {
    const response = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Type Error Hero", gender: 42, classes: [{ class: "Fighter", level: 1 }] }),
    });
    expect(response.status).toBe(400);
  });

  it("creates a character without gender and omits the field", async () => {
    const response = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "No Gender", classes: [{ class: "Rogue", level: 1 }] }),
    });
    expect(response.status).toBe(201);
    const character = await response.json() as { gender?: string };
    expect(character.gender).toBeUndefined();
  });

  it("updates gender on PUT", async () => {
    const createRes = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Update Test", gender: "Female", classes: [{ class: "Cleric", level: 1 }] }),
    });
    const created = await createRes.json() as { id: string; gender: string };
    expect(created.gender).toBe("Female");

    const putRes = await fetch(`${baseUrl}/api/characters/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ gender: "Non-binary" }),
    });
    expect(putRes.status).toBe(200);
    const updated = await putRes.json() as { gender: string };
    expect(updated.gender).toBe("Non-binary");
  });

  it("clears gender on PUT with empty string", async () => {
    const createRes = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Clear Test", gender: "Female", classes: [{ class: "Paladin", level: 1 }] }),
    });
    const created = await createRes.json() as { id: string; gender: string };
    expect(created.gender).toBe("Female");

    const putRes = await fetch(`${baseUrl}/api/characters/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ gender: "" }),
    });
    expect(putRes.status).toBe(200);
    const updated = await putRes.json() as { gender?: string };
    expect(updated.gender).toBeUndefined();
  });

  it("returns 400 when gender exceeds 50 characters on PUT", async () => {
    const createRes = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "PUT Long Gender", classes: [{ class: "Barbarian", level: 1 }] }),
    });
    const created = await createRes.json() as { id: string };

    const longGender = "x".repeat(51);
    const putRes = await fetch(`${baseUrl}/api/characters/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ gender: longGender }),
    });
    expect(putRes.status).toBe(400);
    const body = await putRes.json() as { error: string };
    expect(body.error).toContain("50");
  });

  it("returns 400 when gender is a non-string type on PUT", async () => {
    const createRes = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "PUT Type Error", classes: [{ class: "Druid", level: 1 }] }),
    });
    const created = await createRes.json() as { id: string };

    const putRes = await fetch(`${baseUrl}/api/characters/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ gender: true }),
    });
    expect(putRes.status).toBe(400);
  });
});
