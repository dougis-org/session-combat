import { GET, POST } from "@/app/api/parties/route";
import { PUT } from "@/app/api/parties/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadParties: jest.fn(),
    saveParty: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_PARTIES = [
  { id: "party-1", userId: "user-123", name: "Fellowship", characterIds: [] },
];

const BASE_URL = "http://localhost/api/parties";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest(), mockedRequireAuth);

  it("returns list of parties", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadParties.mockResolvedValue(MOCK_PARTIES as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Fellowship");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockedStorage.loadParties.mockRejectedValue(new Error("Storage error")),
    mockedRequireAuth
  );
});

describe("POST /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(POST, () => makeRequest({ name: "Crew" }), mockedRequireAuth);

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
    const savedParty = (mockedStorage.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty._id).toBeUndefined();
    expect(savedParty.id).toEqual(expect.any(String));
    expect(savedParty.id.length).toBeGreaterThan(0);
  });

  itReturns500(
    POST,
    () => makeRequest({ name: "Doomed Party" }),
    () => mockedStorage.saveParty.mockRejectedValue(new Error("Storage error")),
    mockedRequireAuth
  );
});

describe("PUT /api/parties/[id]", () => {
  const EXISTING_PARTY = {
    id: "party-123",
    userId: "user-123",
    name: "Old Name",
    description: "",
    characterIds: ["char-1"],
    createdAt: new Date("2026-04-07T00:00:00.000Z"),
    updatedAt: new Date("2026-04-07T00:01:00.000Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadParties.mockResolvedValue([EXISTING_PARTY] as any);
    mockedStorage.saveParty.mockResolvedValue(undefined as any);
  });

  it("updates party fields and returns 200", async () => {
    const response = await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "New Name",
        description: "Updated",
        characterIds: ["char-1", "char-2"],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    expect(response.status).toBe(200);
    expect(mockedStorage.saveParty).toHaveBeenCalledTimes(1);
    const savedParty = (mockedStorage.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty).toMatchObject({
      id: "party-123",
      userId: "user-123",
      name: "New Name",
      description: "Updated",
      characterIds: ["char-1", "char-2"],
    });
  });

  it("strips _id from saved payload", async () => {
    await PUT(
      makeRouteRequest("http://localhost/api/parties/party-123", "PUT", {
        name: "New Name",
        description: "Updated",
        characterIds: [],
      }),
      { params: Promise.resolve({ id: "party-123" }) }
    );

    const savedParty = (mockedStorage.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty._id).toBeUndefined();
  });
});
