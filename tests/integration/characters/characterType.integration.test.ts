import fetch from "node-fetch";
import { startTestServer, registerAndGetCookie, TestServer } from "../helpers/server";

interface CharacterResponse {
  id: string;
  name: string;
  characterType: string;
}

describe("Character characterType field — API integration", () => {
  let server: TestServer;
  let baseUrl: string;
  let cookie: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
    const email = `chartype-test-${Date.now()}@example.com`;
    cookie = await registerAndGetCookie(baseUrl, email, "TestPassword123!");
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  function authed() {
    return { "Content-Type": "application/json", Cookie: cookie };
  }

  async function createCharacter(body: Record<string, unknown>): Promise<CharacterResponse> {
    const res = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Test Char", ...body }),
    });
    return res.json() as Promise<CharacterResponse>;
  }

  async function putCharacter(id: string, body: Record<string, unknown>): Promise<{ status: number; char: CharacterResponse }> {
    const res = await fetch(`${baseUrl}/api/characters/${id}`, {
      method: "PUT",
      headers: authed(),
      body: JSON.stringify(body),
    });
    return { status: res.status, char: await res.json() as CharacterResponse };
  }

  // POST tests

  it("defaults characterType to 'character' when field omitted", async () => {
    const char = await createCharacter({ name: "Default Type" });
    expect(char.characterType).toBe("character");
  });

  it("creates character with characterType 'npc' and GET returns it", async () => {
    const created = await createCharacter({ name: "Innkeeper", characterType: "npc" });
    expect(created.characterType).toBe("npc");

    const res = await fetch(`${baseUrl}/api/characters/${created.id}`, { headers: authed() });
    expect(res.status).toBe(200);
    const fetched = await res.json() as CharacterResponse;
    expect(fetched.characterType).toBe("npc");
  });

  it("creates character with characterType 'companion'", async () => {
    const char = await createCharacter({ name: "Familiar", characterType: "companion" });
    expect(char.characterType).toBe("companion");
  });

  it("returns 400 for invalid characterType on POST", async () => {
    const res = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Villain", characterType: "villain" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/characterType/i);
  });

  // PUT tests

  it("updates characterType from 'character' to 'companion' via PUT", async () => {
    const created = await createCharacter({ name: "Shapeshifter", characterType: "character" });
    expect(created.characterType).toBe("character");

    const { status, char: updated } = await putCharacter(created.id, { characterType: "companion" });
    expect(status).toBe(200);
    expect(updated.characterType).toBe("companion");

    const getRes = await fetch(`${baseUrl}/api/characters/${created.id}`, { headers: authed() });
    const fetched = await getRes.json() as CharacterResponse;
    expect(fetched.characterType).toBe("companion");
  });

  it("preserves characterType when not in PUT body", async () => {
    const created = await createCharacter({ name: "Unchanged", characterType: "npc" });

    const { status, char: updated } = await putCharacter(created.id, { name: "Still NPC" });
    expect(status).toBe(200);
    expect(updated.characterType).toBe("npc");
  });

  it("returns 400 for invalid characterType on PUT", async () => {
    const created = await createCharacter({ name: "Bad Update" });
    const { status } = await putCharacter(created.id, { characterType: "villain" });
    expect(status).toBe(400);
  });

  // GET filter tests

  async function setupFilterUser(emailPrefix: string) {
    const email = `${emailPrefix}-${Date.now()}@example.com`;
    const filterCookie = await registerAndGetCookie(baseUrl, email, "TestPassword123!");
    const filterAuthed = { "Content-Type": "application/json", Cookie: filterCookie };

    async function postChar(name: string, characterType: string) {
      return fetch(`${baseUrl}/api/characters`, {
        method: "POST",
        headers: filterAuthed,
        body: JSON.stringify({ name, characterType }),
      });
    }

    return { filterAuthed, postChar };
  }

  it("GET /api/characters?characterType=npc returns only NPCs", async () => {
    const { filterAuthed, postChar } = await setupFilterUser("filter-npc");
    await postChar("PC", "character");
    await postChar("NPC", "npc");
    await postChar("Companion", "companion");

    const res = await fetch(`${baseUrl}/api/characters?characterType=npc`, { headers: filterAuthed });
    expect(res.status).toBe(200);
    const chars = await res.json() as CharacterResponse[];
    expect(chars).toHaveLength(1);
    expect(chars[0].name).toBe("NPC");
    expect(chars[0].characterType).toBe("npc");
  });

  it("GET /api/characters?characterType=all returns all characters", async () => {
    const { filterAuthed, postChar } = await setupFilterUser("filter-all");
    await postChar("PC", "character");
    await postChar("NPC", "npc");

    const res = await fetch(`${baseUrl}/api/characters?characterType=all`, { headers: filterAuthed });
    expect(res.status).toBe(200);
    const chars = await res.json() as CharacterResponse[];
    expect(chars).toHaveLength(2);
  });

  it("GET /api/characters (no filter) returns all characters", async () => {
    const { filterAuthed, postChar } = await setupFilterUser("filter-bare");
    await postChar("PC", "character");
    await postChar("Companion", "companion");

    const res = await fetch(`${baseUrl}/api/characters`, { headers: filterAuthed });
    expect(res.status).toBe(200);
    const chars = await res.json() as CharacterResponse[];
    expect(chars).toHaveLength(2);
  });

  it("GET /api/characters?characterType=npc returns empty array when no NPCs", async () => {
    const { filterAuthed, postChar } = await setupFilterUser("filter-empty");
    await postChar("Only PC", "character");

    const res = await fetch(`${baseUrl}/api/characters?characterType=npc`, { headers: filterAuthed });
    expect(res.status).toBe(200);
    const chars = await res.json() as CharacterResponse[];
    expect(chars).toHaveLength(0);
  });

  it("unauthenticated GET /api/characters?characterType=npc returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/characters?characterType=npc`);
    expect(res.status).toBe(401);
  });
});
