import { GET, POST } from "@/app/api/encounters/route";
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
    loadEncounters: jest.fn(),
    saveEncounter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedStorage = jest.mocked(storage);

const MOCK_ENCOUNTERS = [
  { id: "enc-1", userId: "user-123", name: "Goblin Ambush", monsters: [] },
];

const BASE_URL = "http://localhost/api/encounters";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/encounters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest(), mockedRequireAuth);

  it("returns list of encounters", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue(MOCK_ENCOUNTERS as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Goblin Ambush");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error")),
    mockedRequireAuth
  );
});

describe("POST /api/encounters", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(POST, () => makeRequest({ name: "Test" }), mockedRequireAuth);

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

  itReturns500(
    POST,
    () => makeRequest({ name: "Valid Name" }),
    () => mockedStorage.saveEncounter.mockRejectedValue(new Error("Storage error")),
    mockedRequireAuth
  );
});
