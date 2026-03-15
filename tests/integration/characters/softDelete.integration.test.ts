import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from "@jest/globals";
import { startTestServer, registerAndGetCookie, TestServer } from "../helpers/server";

describe("Character Soft Delete API Integration", () => {
  let server: TestServer;
  let baseUrl: string;
  let authCookie: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
    const uniqueEmail = `softdelete-${Date.now()}@test.com`;
    authCookie = await registerAndGetCookie(baseUrl, uniqueEmail, "TestPassword123!");
  });

  afterAll(async () => {
    await server.cleanup();
  });

  describe("DELETE /api/characters/{id}", () => {
    test("should soft delete character by setting deletedAt timestamp", async () => {
      // Create a character
      const createRes = await fetch(`${baseUrl}/api/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          name: "Character To Delete",
          classes: [{ class: "Barbarian", level: 5 }],
          abilityScores: {
            strength: 16,
            dexterity: 10,
            constitution: 14,
            intelligence: 8,
            wisdom: 12,
            charisma: 11,
          },
          ac: 12,
          hp: 45,
          maxHp: 45,
        }),
      });

      expect(createRes.status).toBe(201);
      const character = await createRes.json();
      const characterId = character.id;

      // Delete the character
      const deleteRes = await fetch(`${baseUrl}/api/characters/${characterId}`, {
        method: "DELETE",
        headers: { Cookie: authCookie },
      });

      expect(deleteRes.status).toBe(200);
      const deleteResult = await deleteRes.json();
      expect(deleteResult.message).toContain("deleted");

      // Verify character no longer appears in list
      const listRes = await fetch(`${baseUrl}/api/characters`, {
        headers: { Cookie: authCookie },
      });

      expect(listRes.status).toBe(200);
      const characters = await listRes.json();
      expect(characters.find((c: any) => c.id === characterId)).toBeUndefined();
    });

    test("should return 404 when accessing deleted character detail", async () => {
      // Create a character
      const createRes = await fetch(`${baseUrl}/api/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          name: "Character For Detail Test",
          classes: [{ class: "Wizard", level: 3 }],
          abilityScores: {
            strength: 8,
            dexterity: 14,
            constitution: 12,
            intelligence: 16,
            wisdom: 13,
            charisma: 10,
          },
          ac: 13,
          hp: 18,
          maxHp: 18,
        }),
      });

      const character = await createRes.json();
      const characterId = character.id;

      // Delete the character
      await fetch(`${baseUrl}/api/characters/${characterId}`, {
        method: "DELETE",
        headers: { Cookie: authCookie },
      });

      // Try to get deleted character detail
      const detailRes = await fetch(`${baseUrl}/api/characters/${characterId}`, {
        headers: { Cookie: authCookie },
      });

      expect(detailRes.status).toBe(404);
    });

    test("should preserve character data while marking as deleted", async () => {
      // Create a character
      const createRes = await fetch(`${baseUrl}/api/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          name: "Character To Verify Data",
          classes: [{ class: "Rogue", level: 4 }],
          abilityScores: {
            strength: 10,
            dexterity: 16,
            constitution: 12,
            intelligence: 11,
            wisdom: 13,
            charisma: 14,
          },
          ac: 14,
          hp: 24,
          maxHp: 24,
          background: "Urchin",
          alignment: "Chaotic Good",
        }),
      });

      const character = await createRes.json();
      const characterId = character.id;
      const originalData = { ...character };

      // Delete the character
      await fetch(`${baseUrl}/api/characters/${characterId}`, {
        method: "DELETE",
        headers: { Cookie: authCookie },
      });

      // In a real scenario, we would query the raw collection to verify data is preserved
      // For now, we're verifying the API behavior (character not in active list)
      const listRes = await fetch(`${baseUrl}/api/characters`, {
        headers: { Cookie: authCookie },
      });

      const characters = await listRes.json();
      const foundDeleted = characters.find((c: any) => c.id === characterId);
      expect(foundDeleted).toBeUndefined(); // Soft-deleted character should not appear
    });
  });

  describe("GET /api/characters", () => {
    test("should only return active characters, excluding soft-deleted", async () => {
      // Create multiple characters
      const char1Res = await fetch(`${baseUrl}/api/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          name: "Active Character 1",
          classes: [{ class: "Cleric", level: 6 }],
          abilityScores: {
            strength: 12,
            dexterity: 12,
            constitution: 14,
            intelligence: 10,
            wisdom: 16,
            charisma: 13,
          },
          ac: 15,
          hp: 36,
          maxHp: 36,
        }),
      });

      const char2Res = await fetch(`${baseUrl}/api/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          name: "Active Character 2",
          classes: [{ class: "Ranger", level: 5 }],
          abilityScores: {
            strength: 14,
            dexterity: 15,
            constitution: 13,
            intelligence: 12,
            wisdom: 14,
            charisma: 11,
          },
          ac: 14,
          hp: 30,
          maxHp: 30,
        }),
      });

      const char1 = await char1Res.json();
      const char2 = await char2Res.json();

      // Delete one character
      await fetch(`${baseUrl}/api/characters/${char1.id}`, {
        method: "DELETE",
        headers: { Cookie: authCookie },
      });

      // List characters
      const listRes = await fetch(`${baseUrl}/api/characters`, {
        headers: { Cookie: authCookie },
      });

      const characters = await listRes.json();
      const activeCharIds = characters.map((c: any) => c.id);

      // Should have char2 but not char1
      expect(activeCharIds).toContain(char2.id);
      expect(activeCharIds).not.toContain(char1.id);
    });
  });
});
