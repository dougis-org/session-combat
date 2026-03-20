import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/encounters/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadEncounters: jest.fn(),
    saveEncounter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_AUTH = { userId: "user-123", email: "user@example.com" };
const MOCK_ENCOUNTERS = [
  { id: "enc-1", userId: "user-123", name: "Goblin Ambush", monsters: [] },
];

function makeRequest(body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/encounters", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/encounters", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns list of encounters", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue(MOCK_ENCOUNTERS as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Goblin Ambush");
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error"));

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});

describe("POST /api/encounters", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await POST(makeRequest({ name: "Test" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ monsters: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "   " }));
    expect(response.status).toBe(400);
  });

  it("creates encounter and returns 201", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveEncounter.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Dragon Lair", description: "Scary", monsters: [] })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Dragon Lair");
    expect(body.userId).toBe("user-123");
    expect(body.description).toBe("Scary");
    expect(mockedStorage.saveEncounter).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveEncounter.mockRejectedValue(new Error("Storage error"));

    const response = await POST(makeRequest({ name: "Valid Name" }));
    expect(response.status).toBe(500);
  });
});
