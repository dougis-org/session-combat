import { POST } from "@/app/api/monsters/global/route";
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
jest.mock("crypto", () => ({ randomUUID: jest.fn(() => "test-uuid") }));
jest.mock("@/lib/data/monsters", () => ({ ALL_SRD_MONSTERS: [] }));
jest.mock("mongodb", () => ({ ObjectId: jest.fn((id: string) => ({ id })) }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);
const mockedGetDatabase = jest.mocked(getDatabase);

// Must be a valid 24-char hex string for MongoDB ObjectId
const ADMIN_AUTH = { userId: "507f1f77bcf86cd799439011", email: "admin@example.com" };

const BASE_BODY = { name: "Goblin", maxHp: 10, hp: 10 };
const makeRequest = (body: unknown) =>
  makeRouteRequest("http://localhost/api/monsters/global", "POST", body);

function mockAdmin() {
  mockDbCollection(mockedGetDatabase, {
    findOne: jest.fn().mockResolvedValue({ isAdmin: true }),
  });
}

describe("POST /api/monsters/global — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
    mockAdmin();
  });

  it("returns 400 for invalid alignment", async () => {
    const response = await POST(makeRequest({ ...BASE_BODY, alignment: "chaotic pancake" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid alignment");
  });

  it("returns 201 for valid alignment", async () => {
    const response = await POST(makeRequest({ ...BASE_BODY, alignment: "Neutral Good" }));
    expect(response.status).toBe(201);
  });

  it("returns 201 when alignment is omitted", async () => {
    const response = await POST(makeRequest(BASE_BODY));
    expect(response.status).toBe(201);
  });
});
