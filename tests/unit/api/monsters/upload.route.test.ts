/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/monsters/upload/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itReturns500,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) => (req: NextRequest) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }),
}));
jest.mock("@/lib/storage", () => ({
  storage: { saveMonsterTemplate: jest.fn() },
}));

const mockedSave = jest.mocked(storage.saveMonsterTemplate);

const BASE_URL = "http://localhost/api/monsters/upload";

const makeReq = (body: unknown = { monsters: [{ name: "G", maxHp: 7 }] }) =>
  makeRouteRequest(BASE_URL, "POST", body);

const makeValidReq = () => makeReq({ monsters: [{ name: "G", maxHp: 7 }] });

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Request parsing ──────────────────────────────────────────────────────────

describe("POST /api/monsters/upload — request parsing", () => {
  it("returns 400 for malformed JSON body", async () => {
    const req = new NextRequest(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
      body: "not valid json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid JSON/i);
  });
});

// ─── Document validation ──────────────────────────────────────────────────────

describe("POST /api/monsters/upload — document validation", () => {
  it("returns 400 when monsters key is missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when monsters is not an array", async () => {
    const res = await POST(makeReq({ monsters: "nope" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty monsters array", async () => {
    const res = await POST(makeReq({ monsters: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when monster is missing name", async () => {
    const res = await POST(makeReq({ monsters: [{ maxHp: 10 }] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when monster is missing maxHp", async () => {
    const res = await POST(makeReq({ monsters: [{ name: "Beast" }] }));
    expect(res.status).toBe(400);
  });
});

// ─── Successful save ──────────────────────────────────────────────────────────

describe("POST /api/monsters/upload — successful save", () => {
  it("returns 201 with count 1 for single valid monster", async () => {
    mockedSave.mockResolvedValueOnce(undefined);
    const res = await POST(makeReq({ monsters: [{ name: "G", maxHp: 7 }] }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.imported).toHaveLength(1);
    expect(body.imported[0].name).toBe("G");
  });

  it("returns 201 with count 2 for two valid monsters", async () => {
    mockedSave.mockResolvedValue(undefined);
    const res = await POST(
      makeReq({ monsters: [{ name: "A", maxHp: 5 }, { name: "B", maxHp: 10 }] })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.count).toBe(2);
  });
});

// ─── Partial and total failure ────────────────────────────────────────────────

describe("POST /api/monsters/upload — partial and total failure", () => {
  it("returns 207 when first save succeeds and second fails", async () => {
    mockedSave
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("fail"));
    const res = await POST(
      makeReq({ monsters: [{ name: "A", maxHp: 5 }, { name: "B", maxHp: 10 }] })
    );
    expect(res.status).toBe(207);
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors).toHaveLength(1);
  });

  itReturns500(
    POST,
    makeValidReq,
    () => mockedSave.mockRejectedValue(new Error("DB")),
  );
});
