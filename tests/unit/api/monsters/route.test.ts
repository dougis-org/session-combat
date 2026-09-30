/**
 * @jest-environment node
 */
import { POST } from "@/app/api/monsters/route";
import * as monsterTemplateRepo from "@/lib/storage/monsterTemplateRepo";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itValidatesAlignmentField,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/monsterTemplateRepo", () => ({
  __esModule: true,
  
    loadAllMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  
}));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const mockedMonsterRepo = jest.mocked(monsterTemplateRepo);

const BASE_BODY = { name: "Goblin", maxHp: 10, hp: 10 };
const makeReqWith = (alignment: string | undefined) =>
  makeRouteRequest("http://localhost/api/monsters", "POST", {
    ...BASE_BODY,
    ...(alignment !== undefined && { alignment }),
  });

describe("POST /api/monsters — alignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedMonsterRepo.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  itValidatesAlignmentField(POST, makeReqWith, 201);
});
