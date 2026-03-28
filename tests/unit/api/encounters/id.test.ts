import { GET, PUT, DELETE } from "@/app/api/encounters/[id]/route";
import { requireAuth } from "@/lib/middleware";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/storage", () => ({
  storage: {
    loadEncounters: jest.fn(),
    saveEncounter: jest.fn(),
    deleteEncounter: jest.fn(),
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
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

  itReturns401WithParams(GET, () => makeRequest("GET"), params, mockedRequireAuth);

  itReturns404WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockedStorage.loadEncounters.mockResolvedValue([]),
    mockedRequireAuth
  );

  it("returns encounter when found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
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
    mockedRequireAuth
  );
});

describe("PUT /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(PUT, () => makeRequest("PUT", {}), params, mockedRequireAuth);

  itReturns404WithParams(
    PUT,
    () => makeRequest("PUT", { name: "New Name" }),
    params,
    () => mockedStorage.loadEncounters.mockResolvedValue([]),
    mockedRequireAuth
  );

  it("returns 400 when name is empty after update", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedStorage.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await PUT(makeRequest("PUT", { name: "  " }), { params });
    expect(response.status).toBe(400);
  });

  it("updates encounter and returns 200", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
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
    mockedRequireAuth
  );
});

describe("DELETE /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(DELETE, () => makeRequest("DELETE"), params, mockedRequireAuth);

  itReturns404WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockedStorage.loadEncounters.mockResolvedValue([]),
    mockedRequireAuth
  );

  it("deletes encounter and returns 200", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
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
    mockedRequireAuth
  );
});
