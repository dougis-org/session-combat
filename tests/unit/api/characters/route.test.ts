import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/characters/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadCharacters: jest.fn(),
    saveCharacter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_AUTH = { userId: "user-123", email: "user@example.com" };
const MOCK_CHARACTERS = [{ id: "char-1", name: "Thorin", userId: "user-123" }];

function makeRequest(body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/characters", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/characters", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns list of characters", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockResolvedValue(MOCK_CHARACTERS as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Thorin");
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadCharacters.mockRejectedValue(new Error("Storage error"));

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});

describe("POST /api/characters", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await POST(makeRequest({ name: "Hero" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ hp: 10 }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "  " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid race", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "Hero", race: "Alien" }));
    expect(response.status).toBe(400);
  });

  it("creates character with defaults and returns 201", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Gandalf" }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Gandalf");
    expect(body.userId).toBe("user-123");
    expect(body.classes).toEqual([{ class: "Fighter", level: 1 }]);
    expect(mockedStorage.saveCharacter).toHaveBeenCalledTimes(1);
  });

  it("creates character with provided classes", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Wizard", classes: [{ class: "Wizard", level: 5 }] })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.classes).toEqual([{ class: "Wizard", level: 5 }]);
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveCharacter.mockRejectedValue(new Error("Storage error"));

    const response = await POST(makeRequest({ name: "Doomed Hero" }));
    expect(response.status).toBe(500);
  });
});
