import { POST } from "@/app/api/monsters/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itValidatesAlignmentField,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => {
  const requireAuth = jest.fn();
  return {
    requireAuth,
    withAuth: (handler: any) => async (request: any) => {
      const auth = requireAuth(request);
      if (auth && 'status' in auth) return auth;
      return handler(request, auth);
    },
    withAuthAndParams: (handler: any) => async (request: any, { params }: any) => {
      const auth = requireAuth(request);
      if (auth && 'status' in auth) return auth;
      return handler(request, auth, await params);
    },
  };
});
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
