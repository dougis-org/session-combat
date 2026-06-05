/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/monsters/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itValidatesAlignmentField,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) => (req: NextRequest) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }),
}));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadAllMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  },
}));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

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
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  itValidatesAlignmentField(POST, makeReqWith, 201);
});
