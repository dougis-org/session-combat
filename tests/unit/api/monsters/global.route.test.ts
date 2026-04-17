import { POST, PUT } from "@/app/api/monsters/global/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import {
  ADMIN_AUTH,
  makeRouteRequest,
  mockDbCollection,
  itValidatesAlignmentField,
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

const BASE_BODY = { name: "Goblin", maxHp: 10, hp: 10 };
const makeReqWith = (alignment: string | undefined) =>
  makeRouteRequest("http://localhost/api/monsters/global", "POST", {
    ...BASE_BODY,
    ...(alignment !== undefined && { alignment }),
  });

describe("POST /api/monsters/global — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockResolvedValue({ isAdmin: true }),
    });
  });

  itValidatesAlignmentField(POST, makeReqWith, 201);
});

describe("POST /api/monsters/global — DB error during admin check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetDatabase.mockRejectedValue(new Error("connection refused"));
  });

  it("returns 500 when isUserAdmin returns null", async () => {
    const req = makeRouteRequest("http://localhost/api/monsters/global", "POST", BASE_BODY);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal server error");
  });
});

describe("PUT /api/monsters/global — DB error during admin check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetDatabase.mockRejectedValue(new Error("connection refused"));
  });

  it("returns 500 when isUserAdmin returns null", async () => {
    const req = makeRouteRequest("http://localhost/api/monsters/global", "PUT", {});
    const res = await PUT(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal server error");
  });
});
