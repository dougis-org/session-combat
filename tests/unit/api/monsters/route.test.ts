import { POST } from "@/app/api/monsters/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadAllMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  },
}));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const BASE_BODY = { name: "Goblin", maxHp: 10, hp: 10 };
const makeRequest = (body: unknown) =>
  makeRouteRequest("http://localhost/api/monsters", "POST", body);

describe("POST /api/monsters — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
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
