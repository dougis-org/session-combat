import { PUT } from "@/app/api/characters/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
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

describe("PUT /api/characters/[id] — gender validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue([EXISTING_CHARACTER] as any);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);
  });

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

describe("PUT /api/characters/[id] — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue([EXISTING_CHARACTER] as any);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);
  });

  it("returns 400 for invalid alignment", async () => {
    const response = await PUT(makeRequest({ alignment: "true neutral" }), { params: PARAMS });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid alignment");
  });

  it("returns 200 for valid alignment", async () => {
    const response = await PUT(makeRequest({ alignment: "Lawful Evil" }), { params: PARAMS });
    expect(response.status).toBe(200);
  });

  it("returns 200 when alignment is omitted", async () => {
    const response = await PUT(makeRequest({ name: "Lyra" }), { params: PARAMS });
    expect(response.status).toBe(200);
  });
});
