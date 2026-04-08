import { POST } from "@/app/api/monsters/global/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import {
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

// Must be a valid 24-char hex string for MongoDB ObjectId
const ADMIN_AUTH = { userId: "507f1f77bcf86cd799439011", email: "admin@example.com" };

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
