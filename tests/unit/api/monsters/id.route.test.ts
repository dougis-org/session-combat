import { PUT } from "@/app/api/monsters/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itValidatesAlignmentFieldWithParams,
} from "@/tests/unit/helpers/route.test.helpers";
import { EXISTING_MONSTER } from "./fixtures";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const PARAMS = Promise.resolve({ id: "monster-1" });
const makeReqWith = (alignment: string | undefined) =>
  makeRouteRequest("http://localhost/api/monsters/monster-1", "PUT", {
    name: EXISTING_MONSTER.name,
    maxHp: EXISTING_MONSTER.maxHp,
    hp: EXISTING_MONSTER.hp,
    ...(alignment !== undefined && { alignment }),
  });

describe("PUT /api/monsters/[id] — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadMonsterTemplates.mockResolvedValue([EXISTING_MONSTER] as any);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  itValidatesAlignmentFieldWithParams(PUT, makeReqWith, PARAMS, 200);
});
