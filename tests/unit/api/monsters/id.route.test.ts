/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/monsters/[id]/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itValidatesAlignmentFieldWithParams,
} from "@/tests/unit/helpers/route.test.helpers";
import { EXISTING_MONSTER } from "./fixtures";

jest.mock("@/lib/middleware", () => ({
  withAuthAndParams: (handler: Function) => async (req: NextRequest, ctx: any) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }, await ctx.params),
}));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadMonsterTemplates: jest.fn(),
    saveMonsterTemplate: jest.fn(),
  },
}));

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
    mockedStorage.loadMonsterTemplates.mockResolvedValue([EXISTING_MONSTER] as any);
    mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined as any);
  });

  itValidatesAlignmentFieldWithParams(PUT, makeReqWith, PARAMS, 200);
});
