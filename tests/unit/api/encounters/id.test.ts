import { NextRequest, NextResponse } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/encounters/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadEncounters: jest.fn(),
    saveEncounter: jest.fn(),
    deleteEncounter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_AUTH = { userId: "user-123", email: "user@example.com" };
const ENC_ID = "enc-abc";
const MOCK_ENCOUNTER = {
  id: ENC_ID,
  userId: "user-123",
  name: "Goblin Cave",
  description: "Dark cave",
  monsters: [],
};

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/encounters/${ENC_ID}`, {
    method,
    headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const params = Promise.resolve({ id: ENC_ID });

describe("GET /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when encounter not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([]);

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(404);
  });

  it("returns encounter when found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(ENC_ID);
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error"));

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(500);
  });
});

describe("PUT /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await PUT(makeRequest("PUT", {}), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when encounter not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([]);

    const response = await PUT(makeRequest("PUT", { name: "New Name" }), {
      params,
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 when name is empty after update", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await PUT(makeRequest("PUT", { name: "  " }), { params });
    expect(response.status).toBe(400);
  });

  it("updates encounter and returns 200", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);
    mockedStorage.saveEncounter.mockResolvedValue(undefined as any);

    const response = await PUT(
      makeRequest("PUT", { name: "Updated Name", description: "New desc" }),
      { params }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe("Updated Name");
    expect(body.description).toBe("New desc");
    expect(mockedStorage.saveEncounter).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error"));

    const response = await PUT(makeRequest("PUT", { name: "Valid" }), {
      params,
    });
    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await DELETE(makeRequest("DELETE"), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when encounter not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([]);

    const response = await DELETE(makeRequest("DELETE"), { params });
    expect(response.status).toBe(404);
  });

  it("deletes encounter and returns 200", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);
    mockedStorage.deleteEncounter.mockResolvedValue(undefined as any);

    const response = await DELETE(makeRequest("DELETE"), { params });

    expect(response.status).toBe(200);
    expect(mockedStorage.deleteEncounter).toHaveBeenCalledWith(
      ENC_ID,
      "user-123"
    );
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error"));

    const response = await DELETE(makeRequest("DELETE"), { params });
    expect(response.status).toBe(500);
  });
});
