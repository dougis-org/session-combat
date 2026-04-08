import { POST } from "@/app/api/monsters/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itValidatesAlignmentField,
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
const makeReqWith = (alignment: string | undefined) =>
  makeRouteRequest("http://localhost/api/monsters", "POST", {
    ...BASE_BODY,
    ...(alignment !== undefined && { alignment }),
  });

describe("POST /api/monsters — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  itValidatesAlignmentField(POST, makeReqWith, 201);
});
