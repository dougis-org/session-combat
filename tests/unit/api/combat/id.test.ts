import { GET, PUT, DELETE } from "@/app/api/combat/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { getDatabase } from "@/lib/db";
import {
  MOCK_AUTH,
  mockDbCollection,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedGetDatabase = jest.mocked(getDatabase);

const COMBAT_ID = "cs-abc-123";
const MOCK_STATE = {
  id: COMBAT_ID,
  userId: "user-123",
  combatants: [],
  currentRound: 1,
  currentTurnIndex: 0,
  isActive: true,
};

const params = Promise.resolve({ id: COMBAT_ID });
const makeRequest = (method: string, body?: unknown) =>
  makeRouteRequest(`http://localhost/api/combat/${COMBAT_ID}`, method, body);

describe("GET /api/combat/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(GET, () => makeRequest("GET"), params, mockedRequireAuth);

  itReturns404WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) }),
    mockedRequireAuth
  );

  it("returns combat state when found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(MOCK_STATE) });

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(COMBAT_ID);
  });

  itReturns500WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
    mockedRequireAuth
  );
});

describe("PUT /api/combat/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(PUT, () => makeRequest("PUT", {}), params, mockedRequireAuth);

  itReturns404WithParams(
    PUT,
    () => makeRequest("PUT", { currentRound: 2 }),
    params,
    () => mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) }),
    mockedRequireAuth
  );

  it("updates combat state and returns 200", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const updateOne = jest.fn().mockResolvedValue({});
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockResolvedValue(MOCK_STATE),
      updateOne,
    });

    const response = await PUT(
      makeRequest("PUT", { currentRound: 2, isActive: false }),
      { params }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.currentRound).toBe(2);
    expect(body.isActive).toBe(false);
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  itReturns500WithParams(
    PUT,
    () => makeRequest("PUT", {}),
    params,
    () => mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
    mockedRequireAuth
  );
});

describe("DELETE /api/combat/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(DELETE, () => makeRequest("DELETE"), params, mockedRequireAuth);

  itReturns404WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) }),
    mockedRequireAuth
  );

  it("deletes combat state and returns 200", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    const deleteOne = jest.fn().mockResolvedValue({});
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockResolvedValue(MOCK_STATE),
      deleteOne,
    });

    const response = await DELETE(makeRequest("DELETE"), { params });

    expect(response.status).toBe(200);
    expect(deleteOne).toHaveBeenCalledTimes(1);
  });

  itReturns500WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
    mockedRequireAuth
  );
});
