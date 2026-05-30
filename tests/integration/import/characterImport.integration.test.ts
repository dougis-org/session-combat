import fetch from "node-fetch";
import { registerTestUser } from "../helpers/users";
import {
  DND_BEYOND_CHARACTER_NAME,
  DND_BEYOND_CHARACTER_URL,
} from "@/tests/helpers/dndBeyondImport";

describe("Character import API integration", () => {
  let baseUrl: string;
  let cookie: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  }, 30000);

  beforeEach(async () => {
    cookie = (await registerTestUser(baseUrl, "import")).cookie;
  });

  test("imports a public D&D Beyond character for an authenticated user", async () => {
    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.character.name).toBe(DND_BEYOND_CHARACTER_NAME);
    expect(body.character.id).toBeTruthy();
    expect(body.warnings).toEqual(expect.any(Array));
    expect(body.sourceUrl).toBe(DND_BEYOND_CHARACTER_URL);
  });

  test("accepts a publicly available URL without a share code", async () => {
    const urlWithoutShareCode =
      "https://www.dndbeyond.com/characters/91913267";

    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: urlWithoutShareCode,
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.character.name).toBe(DND_BEYOND_CHARACTER_NAME);
    expect(body.sourceUrl).toBe(urlWithoutShareCode);
  });

  test("returns a conflict for duplicate-name imports unless overwrite is requested", async () => {
    const firstResponse = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    });

    expect(firstResponse.status).toBe(200);
    const firstBody = await firstResponse.json();

    const conflictResponse = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    });

    expect(conflictResponse.status).toBe(409);
    const conflictBody = await conflictResponse.json();
    expect(conflictBody.conflict).toBe("duplicate-name");
    expect(conflictBody.existingCharacter.id).toBeTruthy();
    expect(conflictBody.existingCharacter.name).toBe(firstBody.character.name);

    const overwriteResponse = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: DND_BEYOND_CHARACTER_URL,
        overwrite: true,
      }),
    });

    expect(overwriteResponse.status).toBe(200);
    const overwriteBody = await overwriteResponse.json();
    expect(overwriteBody.character.id).toBe(conflictBody.existingCharacter.id);
  });

  test("returns 400 for an invalid D&D Beyond URL", async () => {
    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: "https://example.com/not-dnd-beyond",
      }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/canonical public D&D Beyond character URLs/i);
  });

  test("returns 502 when the upstream character service fails", async () => {
    const response = await fetch(`${baseUrl}/api/characters/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        url: "https://www.dndbeyond.com/characters/500/BRdgB3",
      }),
    });

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe("Failed to import D&D Beyond character.");
  });
});
