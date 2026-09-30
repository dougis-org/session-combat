/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/monsters/[id]/route";
import * as monsterTemplateRepo from "@/lib/storage/monsterTemplateRepo";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itValidatesAlignmentFieldWithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";
import { EXISTING_MONSTER } from "./fixtures";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/monsterTemplateRepo", () => ({
  __esModule: true,
  
    loadMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  
}));

const mockedMonsterRepo = jest.mocked(monsterTemplateRepo);

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
    mockAuthState.payload = MOCK_AUTH;
    mockedMonsterRepo.loadMonsterTemplates.mockResolvedValue([EXISTING_MONSTER] as any);
    mockedMonsterRepo.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  itValidatesAlignmentFieldWithParams(PUT, makeReqWith, PARAMS, 200);
});
