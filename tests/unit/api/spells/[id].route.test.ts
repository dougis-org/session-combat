/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/spells/[id]/route";
import * as spellRepo from "@/lib/storage/spellRepo";
import { StorageError } from "@/lib/storage/errors";
import { requireAdmin } from "@/lib/api-helpers";
import {
  makeRouteRequest,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/storage/spellRepo", () => ({
  __esModule: true,
  
    loadSpellById: jest.fn(),
    saveSpellTemplate: jest.fn(),
    deleteSpellTemplate: jest.fn(),
  
}));
jest.mock("@/lib/api-helpers", () => ({ requireAdmin: jest.fn() }));

const mockedSpellRepo = jest.mocked(spellRepo);
const mockedRequireAdmin = jest.mocked(requireAdmin);

const EXISTING_SPELL = {
  id: "spell-123",
  name: "Fireball",
  level: 3,
  concentration: false,
  school: "Evocation" as const,
  description: "A bright streak",
  castingTime: "1 action",
  range: "120 feet",
  duration: "Instantaneous",
  components: { verbal: true, somatic: true, material: false },
  higherLevel: null,
  damageType: "fire",
  saveDc: 15,
  saveType: "dexterity",
  attackRoll: false,
  userId: "global",
  isGlobal: true,
  source: "open5e",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePutReq = (body: unknown) =>
  makeRouteRequest("http://localhost/api/spells/spell-123", "PUT", body);

const makeDeleteReq = () =>
  makeRouteRequest("http://localhost/api/spells/spell-123", "DELETE");

const params = Promise.resolve({ id: "spell-123" });

describe("GET /api/spells/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns spell when found", async () => {
    mockedSpellRepo.loadSpellById.mockResolvedValue(EXISTING_SPELL);

    const req = makeRouteRequest("http://localhost/api/spells/spell-123", "GET");
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("spell-123");
  });

  it("returns 404 when spell not found", async () => {
    mockedSpellRepo.loadSpellById.mockResolvedValue(null);

    const req = makeRouteRequest("http://localhost/api/spells/spell-123", "GET");
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });

  it("returns 500 (not 404) and logs the failure when loadSpellById rejects with a StorageError", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    mockedSpellRepo.loadSpellById.mockRejectedValue(
      new StorageError("loadSpellById", "spellTemplates", { cause: new Error("connection refused") }),
    );

    const req = makeRouteRequest("http://localhost/api/spells/spell-123", "GET");
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load spell");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("PUT /api/spells/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue(null);
  });

  it("updates spell when admin", async () => {
    mockedSpellRepo.loadSpellById.mockResolvedValue(EXISTING_SPELL);
    mockedSpellRepo.saveSpellTemplate.mockResolvedValue(undefined);

    const req = makePutReq({ name: "Updated Fireball" });
    const res = await PUT(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Updated Fireball");
  });

  it("returns 401 when not authenticated", async () => {
    mockedRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const req = makePutReq({ name: "Updated Fireball" });
    const res = await PUT(req, { params });

    expect(res.status).toBe(401);
  });

  it("returns 404 when spell not found", async () => {
    mockedSpellRepo.loadSpellById.mockResolvedValue(null);

    const req = makePutReq({ name: "Updated Fireball" });
    const res = await PUT(req, { params });

    expect(res.status).toBe(404);
  });

  it("returns 500 when storage throws on load", async () => {
    mockedSpellRepo.loadSpellById.mockRejectedValue(new Error("connection refused"));

    const req = makePutReq({ name: "Updated Fireball" });
    const res = await PUT(req, { params });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to update spell");
  });
});

describe("DELETE /api/spells/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue(null);
  });

  it("deletes spell when admin", async () => {
    mockedSpellRepo.loadSpellById.mockResolvedValue(EXISTING_SPELL);
    mockedSpellRepo.deleteSpellTemplate.mockResolvedValue(undefined);

    const req = makeDeleteReq();
    const res = await DELETE(req, { params });

    expect(res.status).toBe(204);
  });

  it("returns 401 when not authenticated", async () => {
    mockedRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const req = makeDeleteReq();
    const res = await DELETE(req, { params });

    expect(res.status).toBe(401);
  });

  it("returns 404 when spell not found", async () => {
    mockedSpellRepo.loadSpellById.mockResolvedValue(null);

    const req = makeDeleteReq();
    const res = await DELETE(req, { params });

    expect(res.status).toBe(404);
  });

  it("returns 500 when storage throws on delete", async () => {
    mockedSpellRepo.loadSpellById.mockRejectedValue(new Error("connection refused"));

    const req = makeDeleteReq();
    const res = await DELETE(req, { params });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to delete spell");
  });
});