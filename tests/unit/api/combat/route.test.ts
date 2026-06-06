/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/combat/route";
import { getDatabase } from "@/lib/db";
import {
  mockDbCollection,
  makeRouteRequest,
  itReturns500,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) => (req: NextRequest) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }),
}));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const mockedGetDatabase = jest.mocked(getDatabase);

const BASE_URL = "http://localhost/api/combat";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/combat", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when no combat state exists", async () => {
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(null) });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeNull();
  });

  it("returns existing combat state", async () => {
    const state = { id: "cs-1", userId: "user-123", combatants: [] };
    mockDbCollection(mockedGetDatabase, { findOne: jest.fn().mockResolvedValue(state) });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("cs-1");
  });

  it("filters by campaignId when provided as query param", async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    mockDbCollection(mockedGetDatabase, { findOne });

    const req = makeRouteRequest(`${BASE_URL}?campaignId=camp-1`, "GET");
    await GET(req);

    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "camp-1" })
    );
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockDbCollection(mockedGetDatabase, {
      findOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
  );
});

describe("POST /api/combat", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates new combat state without campaignId and returns 201", async () => {
    const insertOne = jest.fn().mockResolvedValue({});
    mockDbCollection(mockedGetDatabase, { insertOne });

    const response = await POST(makeRequest({ combatants: [] }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.userId).toBe("user-123");
    expect(body.currentRound).toBe(1);
    expect(body.isActive).toBe(true);
    expect(insertOne).toHaveBeenCalledTimes(1);
  });

  it("creates new combat state with campaignId and returns 201", async () => {
    const insertOne = jest.fn().mockResolvedValue({});
    mockDbCollection(mockedGetDatabase, { insertOne });

    const response = await POST(
      makeRequest({ campaignId: "camp-1", encounterId: "enc-1", combatants: [] })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.userId).toBe("user-123");
    expect(body.campaignId).toBe("camp-1");
    expect(body.encounterId).toBe("enc-1");
    expect(body.currentRound).toBe(1);
    expect(body.isActive).toBe(true);
    expect(insertOne).toHaveBeenCalledTimes(1);
  });

  itReturns500(
    POST,
    () => makeRequest({ combatants: [] }),
    () => mockDbCollection(mockedGetDatabase, {
      insertOne: jest.fn().mockRejectedValue(new Error("DB error")),
    }),
  );
});
