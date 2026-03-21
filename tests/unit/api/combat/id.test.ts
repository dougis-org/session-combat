import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/combat/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { getDatabase } from "@/lib/db";
import {
  MOCK_AUTH,
  mockUnauthorized,
  mockDbCollection,
  makeRouteRequest,
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

  it("returns 401 when not authenticated", async () => {
    mockUnauthorized(mockedRequireAuth);
    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when combat state not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) });

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(404);
  });

  it("returns combat state when found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(MOCK_STATE) });

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(COMBAT_ID);
  });

  it("returns 500 on database error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    });
    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(500);
  });
});

describe("PUT /api/combat/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUnauthorized(mockedRequireAuth);
    const response = await PUT(makeRequest("PUT", {}), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when combat state not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) });

    const response = await PUT(makeRequest("PUT", { currentRound: 2 }), {
      params,
    });
    expect(response.status).toBe(404);
  });

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

  it("returns 500 on database error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    });
    const response = await PUT(makeRequest("PUT", {}), { params });
    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/combat/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUnauthorized(mockedRequireAuth);
    const response = await DELETE(makeRequest("DELETE"), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when combat state not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) });

    const response = await DELETE(makeRequest("DELETE"), { params });
    expect(response.status).toBe(404);
  });

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

  it("returns 500 on database error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    });
    const response = await DELETE(makeRequest("DELETE"), { params });
    expect(response.status).toBe(500);
  });
});
