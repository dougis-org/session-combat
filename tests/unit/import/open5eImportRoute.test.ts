/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/api/import/open5e/route";
import { importMonstersFromOpen5E, importSpellsFromOpen5E } from "@/lib/import/dedupeEngine";
import { requireAdmin } from "@/lib/api-helpers";

jest.mock("@/lib/api-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/import/dedupeEngine", () => ({
  importMonstersFromOpen5E: jest.fn(),
  importSpellsFromOpen5E: jest.fn(),
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedImportMonsters = jest.mocked(importMonstersFromOpen5E);
const mockedImportSpells = jest.mocked(importSpellsFromOpen5E);

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/import/open5e", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("open5e import route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue(null);
    mockedImportMonsters.mockResolvedValue({ inserted: 0, skipped: 0, errors: 0 });
    mockedImportSpells.mockResolvedValue({ inserted: 0, skipped: 0, errors: 0 });
  });

  it("returns auth error when user is not admin", async () => {
    mockedRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const response = await POST(createRequest({ type: "monsters" }));

    expect(response.status).toBe(401);
    expect(mockedImportMonsters).not.toHaveBeenCalled();
  });

  it("imports monsters when type is string", async () => {
    mockedImportMonsters.mockResolvedValue({ inserted: 10, skipped: 2, errors: 1 });

    const response = await POST(createRequest({ type: "monsters" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.monsters).toEqual({ inserted: 10, skipped: 2, errors: 1 });
    expect(mockedImportMonsters).toHaveBeenCalledTimes(1);
    expect(mockedImportSpells).not.toHaveBeenCalled();
  });

  it("imports spells when type is string", async () => {
    mockedImportSpells.mockResolvedValue({ inserted: 5, skipped: 0, errors: 0 });

    const response = await POST(createRequest({ type: "spells" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.spells).toEqual({ inserted: 5, skipped: 0, errors: 0 });
    expect(mockedImportSpells).toHaveBeenCalledTimes(1);
    expect(mockedImportMonsters).not.toHaveBeenCalled();
  });

  it("imports both when type is array", async () => {
    mockedImportMonsters.mockResolvedValue({ inserted: 10, skipped: 0, errors: 0 });
    mockedImportSpells.mockResolvedValue({ inserted: 5, skipped: 0, errors: 0 });

    const response = await POST(createRequest({ type: ["monsters", "spells"] }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.monsters).toEqual({ inserted: 10, skipped: 0, errors: 0 });
    expect(body.spells).toEqual({ inserted: 5, skipped: 0, errors: 0 });
    expect(mockedImportMonsters).toHaveBeenCalledTimes(1);
    expect(mockedImportSpells).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when monsters import throws", async () => {
    mockedImportMonsters.mockRejectedValue(new Error("Network failure"));

    const response = await POST(createRequest({ type: "monsters" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Sync failed");
    expect(body.details).toBe("Network failure");
  });

  it("returns 500 when spells import throws", async () => {
    mockedImportSpells.mockRejectedValue(new Error("API error"));

    const response = await POST(createRequest({ type: "spells" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Sync failed");
    expect(body.details).toBe("API error");
  });

  it("handles non-Error throws gracefully", async () => {
    mockedImportMonsters.mockRejectedValue("string error");

    const response = await POST(createRequest({ type: "monsters" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Sync failed");
    expect(body.details).toBe("Unknown error");
  });
});