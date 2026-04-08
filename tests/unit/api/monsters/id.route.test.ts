import { PUT } from "@/app/api/monsters/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const EXISTING_TEMPLATE = {
  id: "monster-1",
  userId: "user-123",
  name: "Goblin",
  size: "small",
  type: "humanoid",
  ac: 12,
  hp: 7,
  maxHp: 7,
  speed: "30 ft.",
  challengeRating: 0.25,
  abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
  isGlobal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PARAMS = Promise.resolve({ id: "monster-1" });
const BASE_BODY = { name: "Goblin", maxHp: 7, hp: 7 };
const makeRequest = (body: unknown) =>
  makeRouteRequest("http://localhost/api/monsters/monster-1", "PUT", body);

describe("PUT /api/monsters/[id] — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadMonsterTemplates.mockResolvedValue([EXISTING_TEMPLATE] as any);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  it("returns 400 for invalid alignment", async () => {
    const response = await PUT(
      makeRequest({ ...BASE_BODY, alignment: "chaotic pancake" }),
      { params: PARAMS },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid alignment");
  });

  it("returns 200 for valid alignment", async () => {
    const response = await PUT(
      makeRequest({ ...BASE_BODY, alignment: "Lawful Evil" }),
      { params: PARAMS },
    );
    expect(response.status).toBe(200);
  });

  it("returns 200 when alignment is omitted", async () => {
    const response = await PUT(makeRequest(BASE_BODY), { params: PARAMS });
    expect(response.status).toBe(200);
  });
});
