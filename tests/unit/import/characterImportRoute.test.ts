import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/api/characters/import/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { importDndBeyondCharacter } from "@/lib/server/dndBeyondCharacterImport";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";

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

function createImportedCharacter() {
  return {
    character: {
      id: "",
      userId: "",
      name: sampleDndBeyondCharacterResponse.data.name,
      ac: 17,
      hp: 92,
      maxHp: 92,
      abilityScores: {
        strength: 10,
        dexterity: 17,
        constitution: 14,
        intelligence: 16,
        wisdom: 10,
        charisma: 21,
      },
      classes: [
        { class: "Rogue" as const, level: 5 },
        { class: "Warlock" as const, level: 7 },
      ],
      savingThrows: {},
      skills: {},
      damageResistances: [],
      damageImmunities: [],
      damageVulnerabilities: [],
      conditionImmunities: [],
      senses: {},
      languages: ["Common", "Infernal"],
      traits: [],
      actions: [],
      bonusActions: [],
      reactions: [],
      race: "Tiefling" as const,
      alignment: "Chaotic Good" as const,
    },
    warnings: ["Alignment was not supported and was omitted."],
    sourceCharacterId: String(sampleDndBeyondCharacterResponse.data.id),
    sourceUrl: sampleDndBeyondCharacterResponse.data.readonlyUrl,
  };
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
    mockedImportCharacter.mockResolvedValue(createImportedCharacter());
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
        name: "  dolor vagarpie  ",
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
        url: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.conflict).toBe("duplicate-name");
    expect(body.existingCharacter).toEqual({
      id: "existing-id",
      name: "  dolor vagarpie  ",
    });
    expect(body.warnings).toEqual([
      "Alignment was not supported and was omitted.",
    ]);
    expect(mockedSaveCharacter).not.toHaveBeenCalled();
  });

  test("saves a new imported character and returns warnings", async () => {
    const response = await POST(
      createRequest({
        url: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.character.userId).toBe("user-123");
    expect(body.character.id).toBeTruthy();
    expect(body.warnings).toEqual([
      "Alignment was not supported and was omitted.",
    ]);
    expect(body.overwritten).toBe(false);
    expect(mockedSaveCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        name: "Dolor Vagarpie",
      }),
    );
  });

  test("preserves the existing id when overwrite is requested", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    mockedLoadCharacters.mockResolvedValue([
      {
        _id: "mongo-id",
        id: "existing-id",
        userId: "user-123",
        name: "Dolor Vagarpie",
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
        url: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
        overwrite: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.character.id).toBe("existing-id");
    expect(body.character._id).toBe("mongo-id");
    expect(new Date(body.character.createdAt).toISOString()).toBe(
      createdAt.toISOString(),
    );
    expect(body.overwritten).toBe(true);
  });

  test("maps importer validation errors to 400 responses", async () => {
    mockedImportCharacter.mockRejectedValue(
      new Error(
        "Use a public D&D Beyond character URL in the format /characters/<id>/<shareCode>.",
      ),
    );

    const response = await POST(
      createRequest({
        url: "https://www.dndbeyond.com/characters/91913267/invalid",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/format/i);
  });

  test("maps unexpected importer failures to 502 responses", async () => {
    mockedImportCharacter.mockRejectedValue(new Error("Upstream exploded"));

    const response = await POST(
      createRequest({
        url: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Upstream exploded");
  });
});
