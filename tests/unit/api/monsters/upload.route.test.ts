/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/monsters/upload/route";
import { storage } from "@/lib/storage";
import { isUserAdmin } from "@/lib/permissions";
import { GLOBAL_USER_ID } from "@/lib/constants";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage", () => ({
  storage: {
    findExistingMonsterKeys: jest.fn(),
    saveManyMonsterTemplates: jest.fn(),
    deleteMonsterTemplatesByIds: jest.fn(),
  },
}));
jest.mock("@/lib/permissions", () => ({ isUserAdmin: jest.fn() }));

const mockedFindKeys = jest.mocked(storage.findExistingMonsterKeys);
const mockedSaveMany = jest.mocked(storage.saveManyMonsterTemplates);
const mockedDeleteByIds = jest.mocked(storage.deleteMonsterTemplatesByIds);
const mockedIsAdmin = jest.mocked(isUserAdmin);

const BASE_URL = "http://localhost/api/monsters/upload";

const monster = (overrides: Record<string, unknown> = {}) => ({
  name: "Goblin",
  size: "small",
  type: "humanoid",
  ac: 15,
  maxHp: 7,
  speed: "30 ft.",
  challengeRating: 0.25,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  ...overrides,
});

const makeReq = (body: unknown) => makeRouteRequest(BASE_URL, "POST", body);
const makeValidReq = () => makeReq({ monsters: [monster()] });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockAuthState.payload = MOCK_AUTH;
  mockedFindKeys.mockResolvedValue(new Set());
  mockedSaveMany.mockResolvedValue(undefined);
  mockedDeleteByIds.mockResolvedValue(undefined);
  mockedIsAdmin.mockResolvedValue(false);
});

describe("POST /api/monsters/upload — auth", () => {
  itReturns401(POST, makeValidReq);
});

describe("POST /api/monsters/upload — request parsing", () => {
  it("returns 400 for malformed JSON body", async () => {
    const req = new NextRequest(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
      body: "not valid json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Invalid JSON/i);
  });

  it("returns 400 when body is not an array or { monsters }", async () => {
    expect((await POST(makeReq({ data: [] }))).status).toBe(400);
  });

  it("rejects an over-5MB body (measured in UTF-8 bytes) without processing", async () => {
    const huge = "x".repeat(5 * 1024 * 1024 + 10);
    const req = new NextRequest(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
      body: JSON.stringify({ note: huge }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(mockedSaveMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/monsters/upload — document validation", () => {
  it("returns 400 for empty monsters array", async () => {
    expect((await POST(makeReq({ monsters: [] }))).status).toBe(400);
  });

  it("returns 400 when a monster is missing a required field", async () => {
    const res = await POST(makeReq({ monsters: [{ name: "Beast", maxHp: 10 }] }));
    expect(res.status).toBe(400);
    expect(mockedSaveMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/monsters/upload — successful ingestion", () => {
  it("returns 200 with inserted names and reverted false", async () => {
    const res = await POST(makeReq({ monsters: [monster({ name: "A" }), monster({ name: "B" })] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inserted).toEqual(["A", "B"]);
    expect(body.reverted).toBe(false);
    expect(mockedSaveMany).toHaveBeenCalledTimes(1);
    expect(mockedFindKeys).toHaveBeenCalledTimes(1);
  });

  it("is never HTTP 207", async () => {
    mockedSaveMany.mockRejectedValueOnce(new Error("partial"));
    const res = await POST(makeReq({ monsters: [monster({ name: "A" }), monster({ name: "B" })] }));
    expect(res.status).not.toBe(207);
  });
});

describe("POST /api/monsters/upload — duplicate handling", () => {
  it("skips a monster whose name+source already exists", async () => {
    mockedFindKeys.mockResolvedValue(new Set(["Goblin|SRD"]));
    const res = await POST(
      makeReq({ monsters: [monster({ name: "Goblin", source: "SRD" }), monster({ name: "Orc" })] }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.inserted).toEqual(["Orc"]);
    expect(body.skippedDuplicates).toEqual(["Goblin"]);
  });

  it("collapses an in-file repeat (first wins)", async () => {
    const res = await POST(
      makeReq({ monsters: [monster({ name: "Twin", source: "X" }), monster({ name: "Twin", source: "X" })] }),
    );
    const body = await res.json();
    expect(body.inserted).toEqual(["Twin"]);
    expect(body.skippedDuplicates).toEqual(["Twin"]);
  });

  it("all-duplicates → 200 with empty inserted, not an error", async () => {
    mockedFindKeys.mockResolvedValue(new Set(["Goblin|"]));
    const res = await POST(makeReq({ monsters: [monster({ name: "Goblin" })] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inserted).toEqual([]);
    expect(body.skippedDuplicates).toEqual(["Goblin"]);
    expect(mockedSaveMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/monsters/upload — revert on failure", () => {
  it("calls the compensating delete with generated ids and reports reverted", async () => {
    mockedSaveMany.mockRejectedValue(new Error("DB driver blew up"));
    const res = await POST(makeReq({ monsters: [monster({ name: "A" }), monster({ name: "B" })] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.reverted).toBe(true);
    expect(mockedDeleteByIds).toHaveBeenCalledTimes(1);
    const [ids, userId] = mockedDeleteByIds.mock.calls[0];
    expect(ids).toHaveLength(2);
    expect(userId).toBe(MOCK_AUTH.userId);
    expect(JSON.stringify(body)).not.toMatch(/driver blew up/);
  });
});

describe("POST /api/monsters/upload — scope", () => {
  it("non-admin requesting global → 403, no writes", async () => {
    mockedIsAdmin.mockResolvedValue(false);
    const res = await POST(makeReq({ monsters: [monster()], scope: "global" }));
    expect(res.status).toBe(403);
    expect(mockedSaveMany).not.toHaveBeenCalled();
  });

  it("admin requesting global → monsters saved under GLOBAL_USER_ID and isGlobal true", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    const res = await POST(makeReq({ monsters: [monster()], scope: "global" }));
    expect(res.status).toBe(200);
    const [templates] = mockedSaveMany.mock.calls[0];
    expect(templates[0].userId).toBe(GLOBAL_USER_ID);
    expect(templates[0].isGlobal).toBe(true);
  });

  it("default scope → caller userId, isGlobal false", async () => {
    const res = await POST(makeValidReq());
    expect(res.status).toBe(200);
    const [templates] = mockedSaveMany.mock.calls[0];
    expect(templates[0].userId).toBe(MOCK_AUTH.userId);
    expect(templates[0].isGlobal).toBe(false);
  });
});
