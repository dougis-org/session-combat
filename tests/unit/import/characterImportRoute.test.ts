import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/api/characters/import/route";
import { DndBeyondImportError } from "@/lib/dndBeyondCharacterImport";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { importDndBeyondCharacter } from "@/lib/server/dndBeyondCharacterImport";
import {
  createNormalizedImportResult,
  DND_BEYOND_CHARACTER_NAME,
  DND_BEYOND_CHARACTER_URL,
  EXISTING_IMPORTED_CHARACTER_ID,
  IMPORT_WARNING,
} from "@/tests/helpers/dndBeyondImport";

jest.mock("@/lib/middleware", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  storage: {
    loadCharacters: jest.fn(),
    saveCharacter: jest.fn(),
  },
}));

jest.mock("@/lib/server/dndBeyondCharacterImport", () => ({
  importDndBeyondCharacter: jest.fn(),
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedLoadCharacters = jest.mocked(storage.loadCharacters);
const mockedSaveCharacter = jest.mocked(storage.saveCharacter);
const mockedImportCharacter = jest.mocked(importDndBeyondCharacter);

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/characters/import", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("character import route", () => {
  beforeEach(() => {
    mockedRequireAuth.mockReset();
    mockedLoadCharacters.mockReset();
    mockedSaveCharacter.mockReset();
    mockedImportCharacter.mockReset();

    mockedRequireAuth.mockReturnValue({ userId: "user-123" });
    mockedLoadCharacters.mockResolvedValue([]);
    mockedSaveCharacter.mockResolvedValue(undefined);
    mockedImportCharacter.mockResolvedValue(createNormalizedImportResult());
  });

  test("returns auth response when the user is not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(createRequest({ url: "https://example.com" }));

    expect(response.status).toBe(401);
  });

  test("returns 400 when the import URL is blank", async () => {
    const response = await POST(createRequest({ url: "   " }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/url is required/i);
    expect(mockedImportCharacter).not.toHaveBeenCalled();
  });

  test("returns duplicate-name conflicts without overwriting", async () => {
    mockedLoadCharacters.mockResolvedValue([
      {
        id: "existing-id",
        userId: "user-123",
        name: `  ${DND_BEYOND_CHARACTER_NAME.toLowerCase()}  `,
        ac: 12,
        hp: 10,
        maxHp: 10,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        classes: [{ class: "Rogue", level: 1 }],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ] as never);

    const response = await POST(
      createRequest({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.conflict).toBe("duplicate-name");
    expect(body.existingCharacter).toEqual({
      id: "existing-id",
      name: `  ${DND_BEYOND_CHARACTER_NAME.toLowerCase()}  `,
    });
    expect(body.warnings).toEqual([IMPORT_WARNING]);
    expect(mockedSaveCharacter).not.toHaveBeenCalled();
  });

  test("saves a new imported character and returns warnings and sourceUrl", async () => {
    const response = await POST(
      createRequest({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.character.userId).toBe("user-123");
    expect(body.character.id).toBeTruthy();
    expect(body.warnings).toEqual([IMPORT_WARNING]);
    expect(body.overwritten).toBe(false);
    expect(body.sourceUrl).toBe(DND_BEYOND_CHARACTER_URL);
    expect(mockedSaveCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        name: DND_BEYOND_CHARACTER_NAME,
      }),
    );
  });

  test("preserves the existing id when overwrite is requested", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    mockedLoadCharacters.mockResolvedValue([
      {
        _id: "mongo-id",
        id: EXISTING_IMPORTED_CHARACTER_ID,
        userId: "user-123",
        name: DND_BEYOND_CHARACTER_NAME,
        ac: 12,
        hp: 10,
        maxHp: 10,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        classes: [{ class: "Rogue", level: 1 }],
        createdAt,
      },
    ] as never);

    const response = await POST(
      createRequest({
        url: DND_BEYOND_CHARACTER_URL,
        overwrite: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.character.id).toBe(EXISTING_IMPORTED_CHARACTER_ID);
    expect(body.character._id).toBe("mongo-id");
    expect(new Date(body.character.createdAt).toISOString()).toBe(
      createdAt.toISOString(),
    );
    expect(body.overwritten).toBe(true);
  });

  test("maps importer validation errors to 400 responses", async () => {
    mockedImportCharacter.mockRejectedValue(
      new DndBeyondImportError(
        "Use a publicly available D&D Beyond character URL.",
        { status: 400 },
      ),
    );

    const response = await POST(
      createRequest({
        url: "https://www.dndbeyond.com/characters/91913267/invalid",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/publicly available/i);
  });

  test("maps unexpected importer failures to 502 responses", async () => {
    mockedImportCharacter.mockRejectedValue(new Error("Upstream exploded"));

    const response = await POST(
      createRequest({
        url: DND_BEYOND_CHARACTER_URL,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Failed to import D&D Beyond character.");
  });
});
