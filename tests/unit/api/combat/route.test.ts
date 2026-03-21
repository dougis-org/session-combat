import { GET, POST } from "@/app/api/combat/route";
import { requireAuth } from "@/lib/middleware";
import { getDatabase } from "@/lib/db";
import {
  MOCK_AUTH,
  mockDbCollection,
  makeRouteRequest,
  itReturns401,
  itReturns500,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedGetDatabase = jest.mocked(getDatabase);

const BASE_URL = "http://localhost/api/combat";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/combat", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest(), mockedRequireAuth);

  it("returns null when no combat state exists", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeNull();
  });

  it("returns existing combat state", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const state = { id: "cs-1", userId: "user-123", combatants: [] };
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(state) });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("cs-1");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
    mockedRequireAuth
  );
});

describe("POST /api/combat", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(POST, () => makeRequest({ combatants: [] }), mockedRequireAuth);

  it("creates new combat state and returns 201", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const updateOne = jest.fn().mockResolvedValue({});
    mockDbCollection(mockedGetDatabase, { updateOne });

    const response = await POST(
      makeRequest({ encounterId: "enc-1", combatants: [] })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.userId).toBe("user-123");
    expect(body.encounterId).toBe("enc-1");
    expect(body.currentRound).toBe(1);
    expect(body.isActive).toBe(true);
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  itReturns500(
    POST,
    () => makeRequest({ combatants: [] }),
    () => mockDbCollection(mockedGetDatabase, {
      updateOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
    mockedRequireAuth
  );
});
