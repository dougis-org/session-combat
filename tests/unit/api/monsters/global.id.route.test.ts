import { PUT, DELETE } from "@/app/api/monsters/global/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import {
  ADMIN_AUTH,
  makeRouteRequest,
  mockDbCollection,
  itValidatesAlignmentFieldWithParams,
} from "@/tests/unit/helpers/route.test.helpers";
import { EXISTING_GLOBAL_MONSTER } from "./fixtures";

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

const PARAMS = Promise.resolve({ id: EXISTING_GLOBAL_MONSTER.id });
const makeReqWith = (alignment: string | undefined) =>
  makeRouteRequest(`http://localhost/api/monsters/global/${EXISTING_GLOBAL_MONSTER.id}`, "PUT", {
    name: EXISTING_GLOBAL_MONSTER.name,
    maxHp: EXISTING_GLOBAL_MONSTER.maxHp,
    hp: EXISTING_GLOBAL_MONSTER.hp,
    ...(alignment !== undefined && { alignment }),
  });

describe("PUT /api/monsters/global/[id] — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedStorage.loadGlobalMonsterTemplates.mockResolvedValue([EXISTING_GLOBAL_MONSTER] as any);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockResolvedValue({ isAdmin: true }),
    });
  });

  itValidatesAlignmentFieldWithParams(PUT, makeReqWith, PARAMS, 200);
});

describe("PUT /api/monsters/global/[id] — DB error during admin check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetDatabase.mockRejectedValue(new Error("connection refused"));
  });

  it("returns 500 when isUserAdmin returns null", async () => {
    const req = makeRouteRequest(
      `http://localhost/api/monsters/global/${EXISTING_GLOBAL_MONSTER.id}`,
      "PUT",
      { name: "x", maxHp: 10 }
    );
    const res = await PUT(req, { params: PARAMS });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal server error");
  });
});

describe("DELETE /api/monsters/global/[id] — DB error during admin check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetDatabase.mockRejectedValue(new Error("connection refused"));
  });

  it("returns 500 when isUserAdmin returns null", async () => {
    const req = makeRouteRequest(
      `http://localhost/api/monsters/global/${EXISTING_GLOBAL_MONSTER.id}`,
      "DELETE"
    );
    const res = await DELETE(req, { params: PARAMS });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal server error");
  });
});
