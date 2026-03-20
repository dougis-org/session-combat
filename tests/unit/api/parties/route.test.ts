import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/parties/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadParties: jest.fn(),
    saveParty: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_AUTH = { userId: "user-123", email: "user@example.com" };
const MOCK_PARTIES = [
  { id: "party-1", userId: "user-123", name: "Fellowship", characterIds: [] },
];

function makeRequest(body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/parties", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns list of parties", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadParties.mockResolvedValue(MOCK_PARTIES as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Fellowship");
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadParties.mockRejectedValue(new Error("Storage error"));

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});

describe("POST /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const response = await POST(makeRequest({ name: "Crew" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ characterIds: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const response = await POST(makeRequest({ name: "  " }));
    expect(response.status).toBe(400);
  });

  it("creates party and returns 201", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({
        name: "The Avengers",
        description: "Earth's mightiest heroes",
        characterIds: ["char-1", "char-2"],
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("The Avengers");
    expect(body.userId).toBe("user-123");
    expect(body.characterIds).toEqual(["char-1", "char-2"]);
    expect(mockedStorage.saveParty).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on storage error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.saveParty.mockRejectedValue(new Error("Storage error"));

    const response = await POST(makeRequest({ name: "Doomed Party" }));
    expect(response.status).toBe(500);
  });
});
