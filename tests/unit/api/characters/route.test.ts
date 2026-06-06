/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/characters/route";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
  itValidatesAlignmentField,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").mockMiddleware);
jest.mock("@/lib/storage", () => ({
  storage: {
    loadCharacters: jest.fn(),
    saveCharacter: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage);

const MOCK_CHARACTERS = [{ id: "char-1", name: "Thorin", userId: "user-123" }];

const BASE_URL = "http://localhost/api/characters";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/characters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest());

  it("returns list of characters", async () => {
    mockAuthState.payload = MOCK_AUTH;
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
    () => mockedStorage.loadCharacters.mockRejectedValue(new Error("Storage error"))
  );
});

describe("POST /api/characters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);
  });

  itReturns401(POST, () => makeRequest({ name: "Hero" }));

  it("returns 400 when name is missing", async () => {
    const response = await POST(makeRequest({ hp: 10 }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    const response = await POST(makeRequest({ name: "  " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid race", async () => {
    const response = await POST(makeRequest({ name: "Hero", race: "Alien" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when gender exceeds 50 characters", async () => {
    const response = await POST(makeRequest({ name: "Hero", gender: "x".repeat(51) }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("50");
  });

  it("returns 400 when gender is not a string", async () => {
    const response = await POST(makeRequest({ name: "Hero", gender: 42 }));
    expect(response.status).toBe(400);
  });

  it("creates character with gender and trims whitespace", async () => {
    const response = await POST(makeRequest({ name: "Hero", gender: "  Female  " }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.gender).toBe("Female");
  });

  it("omits gender from response when not provided", async () => {
    const response = await POST(makeRequest({ name: "Hero" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.gender).toBeUndefined();
  });

  it("creates character with defaults and returns 201", async () => {
    const response = await POST(makeRequest({ name: "Gandalf" }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Gandalf");
    expect(body.userId).toBe("user-123");
    expect(body.classes).toEqual([{ class: "Fighter", level: 1 }]);
    expect(mockedStorage.saveCharacter).toHaveBeenCalledTimes(1);
  });

  it("creates character with provided classes", async () => {
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
    () => mockedStorage.saveCharacter.mockRejectedValue(new Error("Storage error"))
  );

  itValidatesAlignmentField(
    POST,
    (alignment) => makeRequest({ name: "Hero", ...(alignment !== undefined && { alignment }) }),
    201,
  );

  it("defaults characterType to 'character' when omitted", async () => {
    const response = await POST(makeRequest({ name: "Gandalf" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("character");
  });

  it("accepts characterType 'npc'", async () => {
    const response = await POST(makeRequest({ name: "Innkeeper", characterType: "npc" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("npc");
  });

  it("accepts characterType 'companion'", async () => {
    const response = await POST(makeRequest({ name: "Familiar", characterType: "companion" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("companion");
  });

  it("accepts characterType 'character'", async () => {
    const response = await POST(makeRequest({ name: "Hero", characterType: "character" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.characterType).toBe("character");
  });

  it("returns 400 for invalid characterType", async () => {
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

  const CHAR_WITHOUT_TYPE = { id: "c4", name: "Legacy", userId: "user-123" };

  function makeGetRequest(path: string) {
    const { NextRequest } = require("next/server");
    return new NextRequest(`http://localhost${path}`, {
      method: "GET",
      headers: { cookie: "auth-token=t" },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedStorage.loadCharacters.mockResolvedValue(MOCK_CHARS as any);
  });

  it("returns all characters when no filter provided", async () => {
    const response = await GET(makeGetRequest("/api/characters"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(3);
  });

  it("returns all characters when characterType=all", async () => {
    const response = await GET(makeGetRequest("/api/characters?characterType=all"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(3);
  });

  it("returns only NPCs when characterType=npc", async () => {
    const response = await GET(makeGetRequest("/api/characters?characterType=npc"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Innkeeper");
  });

  it("returns 400 for invalid characterType query param", async () => {
    const response = await GET(makeGetRequest("/api/characters?characterType=villain"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/characterType/i);
  });

  it("coerces missing characterType to 'character' for legacy documents", async () => {
    mockedStorage.loadCharacters.mockResolvedValue([CHAR_WITHOUT_TYPE] as any);
    const response = await GET(makeGetRequest("/api/characters"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].characterType).toBe("character");
  });

  it("legacy document without characterType is included in 'character' filter", async () => {
    mockedStorage.loadCharacters.mockResolvedValue([CHAR_WITHOUT_TYPE] as any);
    const response = await GET(makeGetRequest("/api/characters?characterType=character"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].characterType).toBe("character");
  });
});
