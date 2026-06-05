/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/encounters/[id]/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itReturns404WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({
  withAuthAndParams: (handler: Function) => async (req: NextRequest, ctx: any) =>
    handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }, await ctx.params),
}));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadEncounters: jest.fn(),
    saveEncounter: jest.fn(),
    deleteEncounter: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage);

const ENC_ID = "enc-abc";
const MOCK_ENCOUNTER = {
  id: ENC_ID,
  userId: "user-123",
  name: "Goblin Cave",
  description: "Dark cave",
  monsters: [],
};

const params = Promise.resolve({ id: ENC_ID });
const makeRequest = (method: string, body?: unknown) =>
  makeRouteRequest(`http://localhost/api/encounters/${ENC_ID}`, method, body);

describe("GET /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns404WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockedStorage.loadEncounters.mockResolvedValue([]),
  );

  it("returns encounter when found", async () => {
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(ENC_ID);
  });

  itReturns500WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error")),
  );
});

describe("PUT /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns404WithParams(
    PUT,
    () => makeRequest("PUT", { name: "New Name" }),
    params,
    () => mockedStorage.loadEncounters.mockResolvedValue([]),
  );

  it("returns 400 when name is empty after update", async () => {
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await PUT(makeRequest("PUT", { name: "  " }), { params });
    expect(response.status).toBe(400);
  });

  it("updates encounter and returns 200", async () => {
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

  itReturns500WithParams(
    PUT,
    () => makeRequest("PUT", { name: "Valid" }),
    params,
    () => mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error")),
  );
});

describe("DELETE /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns404WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockedStorage.loadEncounters.mockResolvedValue([]),
  );

  it("deletes encounter and returns 200", async () => {
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);
    mockedStorage.deleteEncounter.mockResolvedValue(undefined as any);

    const response = await DELETE(makeRequest("DELETE"), { params });

    expect(response.status).toBe(200);
    expect(mockedStorage.deleteEncounter).toHaveBeenCalledWith(
      ENC_ID,
      "user-123"
    );
  });

  itReturns500WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockedStorage.loadEncounters.mockRejectedValue(new Error("Storage error")),
  );
});
