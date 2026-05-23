import { PUT } from "@/app/api/characters/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itValidatesAlignmentFieldWithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => {
  const requireAuth = jest.fn();
  return {
    requireAuth,
    withAuth: (handler: any) => async (request: any) => {
      const auth = requireAuth(request);
      if (auth && 'status' in auth) return auth;
      return handler(request, auth);
    },
    withAuthAndParams: (handler: any) => async (request: any, { params }: any) => {
      const auth = requireAuth(request);
      if (auth && 'status' in auth) return auth;
      return handler(request, auth, await params);
    },
  };
});
jest.mock("@/lib/storage", () => ({
  storage: {
    loadCharacters: jest.fn(),
    saveCharacter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const EXISTING_CHARACTER = {
  id: "char-1",
  userId: "user-123",
  name: "Lyra",
  gender: "Female",
  classes: [{ class: "Wizard", level: 3 }],
  race: "Elf",
  hp: 0,
  maxHp: 0,
  ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  savingThrows: {},
  skills: {},
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
  senses: {},
  languages: [],
  traits: [],
  actions: [],
  bonusActions: [],
  reactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PARAMS = Promise.resolve({ id: "char-1" });

const makeRequest = (body: unknown) =>
  makeRouteRequest("http://localhost/api/characters/char-1", "PUT", body);

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAuth.mockReturnValue(MOCK_AUTH);
  mockedStorage.loadCharacters.mockResolvedValue([EXISTING_CHARACTER] as any);
  mockedStorage.saveCharacter.mockResolvedValue(undefined as any);
});

describe("PUT /api/characters/[id] — gender validation", () => {

  it("returns 400 when gender exceeds 50 characters", async () => {
    const response = await PUT(makeRequest({ gender: "x".repeat(51) }), { params: PARAMS });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("50");
  });

  it("returns 400 when gender is not a string", async () => {
    const response = await PUT(makeRequest({ gender: true }), { params: PARAMS });
    expect(response.status).toBe(400);
  });

  it("updates gender and trims whitespace", async () => {
    const response = await PUT(makeRequest({ gender: "  Non-binary  " }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gender).toBe("Non-binary");
  });

  it("clears gender when empty string is provided", async () => {
    const response = await PUT(makeRequest({ gender: "" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gender).toBeUndefined();
  });

  it("preserves existing gender when gender not in payload", async () => {
    const response = await PUT(makeRequest({ name: "Lyra Renamed" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gender).toBe("Female");
  });
});

describe("GET /api/characters/[id] — backward compat coercion", () => {

  it("coerces missing characterType to 'character' for legacy document", async () => {
    // EXISTING_CHARACTER has no characterType — simulates a legacy BSON document
    mockedStorage.loadCharacters.mockResolvedValue([EXISTING_CHARACTER] as any);

    const { GET } = await import("@/app/api/characters/[id]/route");
    const req = makeRouteRequest("http://localhost/api/characters/char-1", "GET");
    const response = await GET(req, { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.characterType).toBe("character");
  });
});

describe("PUT /api/characters/[id] — characterType", () => {

  it("updates characterType from 'character' to 'npc'", async () => {
    const response = await PUT(makeRequest({ characterType: "npc" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.characterType).toBe("npc");
  });

  it("updates characterType to 'companion'", async () => {
    const response = await PUT(makeRequest({ characterType: "companion" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.characterType).toBe("companion");
  });

  it("preserves existing characterType when field omitted", async () => {
    const charWithType = { ...EXISTING_CHARACTER, characterType: "companion" as const };
    mockedStorage.loadCharacters.mockResolvedValue([charWithType] as any);

    const response = await PUT(makeRequest({ name: "Lyra Renamed" }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.characterType).toBe("companion");
  });

  it("returns 400 for invalid characterType", async () => {
    const response = await PUT(makeRequest({ characterType: "villain" }), { params: PARAMS });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/characterType/i);
  });
});

describe("PUT /api/characters/[id] — alignment validation", () => {

  itValidatesAlignmentFieldWithParams(
    PUT,
    (alignment) => makeRequest(alignment !== undefined ? { alignment } : { name: "Lyra" }),
    PARAMS,
    200,
  );
});
