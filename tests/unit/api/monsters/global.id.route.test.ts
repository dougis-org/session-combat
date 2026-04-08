import { PUT } from "@/app/api/monsters/global/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockDbCollection,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadGlobalMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  },
}));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
jest.mock("mongodb", () => ({ ObjectId: jest.fn((id: string) => ({ id })) }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);
const mockedGetDatabase = jest.mocked(getDatabase);

// Must be a valid 24-char hex string for MongoDB ObjectId
const ADMIN_AUTH = { userId: "507f1f77bcf86cd799439011", email: "admin@example.com" };

const EXISTING_GLOBAL_TEMPLATE = {
  id: "global-1",
  userId: "GLOBAL",
  name: "Zombie",
  size: "medium",
  type: "undead",
  ac: 8,
  hp: 22,
  maxHp: 22,
  speed: "20 ft.",
  challengeRating: 0.125,
  abilityScores: { strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5 },
  isGlobal: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PARAMS = Promise.resolve({ id: "global-1" });
const BASE_BODY = { name: "Zombie", maxHp: 22, hp: 22 };
const makeRequest = (body: unknown) =>
  makeRouteRequest("http://localhost/api/monsters/global/global-1", "PUT", body);

function mockAdmin() {
  mockDbCollection(mockedGetDatabase, {
    findOne: jest.fn().mockResolvedValue({ isAdmin: true }),
  });
}

describe("PUT /api/monsters/global/[id] — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedStorage.loadGlobalMonsterTemplates.mockResolvedValue([EXISTING_GLOBAL_TEMPLATE] as any);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
    mockAdmin();
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
