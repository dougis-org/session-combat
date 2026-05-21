import { GET, POST } from "@/app/api/characters/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
  itValidatesAlignmentField,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadCharacters: jest.fn(),
    saveCharacter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_CHARACTERS = [{ id: "char-1", name: "Thorin", userId: "user-123" }];

const BASE_URL = "http://localhost/api/characters";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/characters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest(), mockedRequireAuth);

  it("returns list of characters", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue(MOCK_CHARACTERS as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Thorin");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockedStorage.loadCharacters.mockRejectedValue(new Error("Storage error")),
    mockedRequireAuth
  );
});

describe("POST /api/characters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(POST, () => makeRequest({ name: "Hero" }), mockedRequireAuth);

  it("returns 400 when name is missing", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ hp: 10 }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "  " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid race", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "Hero", race: "Alien" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when gender exceeds 50 characters", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "Hero", gender: "x".repeat(51) }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("50");
  });

  it("returns 400 when gender is not a string", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "Hero", gender: 42 }));
    expect(response.status).toBe(400);
  });

  it("creates character with gender and trims whitespace", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Hero", gender: "  Female  " }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.gender).toBe("Female");
  });

  it("omits gender from response when not provided", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Hero" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.gender).toBeUndefined();
  });

  it("creates character with defaults and returns 201", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Gandalf" }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Gandalf");
    expect(body.userId).toBe("user-123");
    expect(body.classes).toEqual([{ class: "Fighter", level: 1 }]);
    expect(mockedStorage.saveCharacter).toHaveBeenCalledTimes(1);
  });

  it("creates character with provided classes", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Wizard", classes: [{ class: "Wizard", level: 5 }] })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.classes).toEqual([{ class: "Wizard", level: 5 }]);
  });

  itReturns500(
    POST,
    () => makeRequest({ name: "Doomed Hero" }),
    () => mockedStorage.saveCharacter.mockRejectedValue(new Error("Storage error")),
    mockedRequireAuth
  );

  itValidatesAlignmentField(
    POST,
    (alignment) => makeRequest({ name: "Hero", ...(alignment !== undefined && { alignment }) }),
    201,
    () => {
      mockedRequireAuth.mockReturnValue(MOCK_AUTH);
      mockedStorage.saveCharacter.mockResolvedValue(undefined as any);
    },
  );

  it("defaults characterType to 'character' when omitted", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Gandalf" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("character");
  });

  it("accepts characterType 'npc'", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Innkeeper", characterType: "npc" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("npc");
  });

  it("accepts characterType 'companion'", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Familiar", characterType: "companion" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("companion");
  });

  it("accepts characterType 'character'", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Hero", characterType: "character" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("character");
  });

  it("returns 400 for invalid characterType", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Villain", characterType: "villain" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/characterType/i);
  });
});

describe("GET /api/characters — characterType filter", () => {
  const MOCK_CHARS = [
    { id: "c1", name: "Hero", userId: "user-123", characterType: "character" },
    { id: "c2", name: "Innkeeper", userId: "user-123", characterType: "npc" },
    { id: "c3", name: "Familiar", userId: "user-123", characterType: "companion" },
  ];

  beforeEach(() => jest.clearAllMocks());

  it("returns all characters when no filter provided", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue(MOCK_CHARS as any);

    const response = await GET(new (require("next/server").NextRequest)(
      "http://localhost/api/characters",
      { method: "GET", headers: { cookie: "auth-token=t" } }
    ));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(3);
  });

  it("returns all characters when characterType=all", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue(MOCK_CHARS as any);

    const response = await GET(new (require("next/server").NextRequest)(
      "http://localhost/api/characters?characterType=all",
      { method: "GET", headers: { cookie: "auth-token=t" } }
    ));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(3);
  });

  it("returns only NPCs when characterType=npc", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue(MOCK_CHARS as any);

    const response = await GET(new (require("next/server").NextRequest)(
      "http://localhost/api/characters?characterType=npc",
      { method: "GET", headers: { cookie: "auth-token=t" } }
    ));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Innkeeper");
  });
});
