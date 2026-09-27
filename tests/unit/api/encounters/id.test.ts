/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from "@/app/api/encounters/[id]/route";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/encounterRepo", () => ({
  loadEncounters: jest.fn(),
  saveEncounter: jest.fn(),
  deleteEncounter: jest.fn(),
}));

import * as encounterRepo from "@/lib/storage/encounterRepo";

const mockedEncounterRepo = jest.mocked(encounterRepo);

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

  itReturns401WithParams(GET, () => makeRequest("GET"), params);

  itReturns404WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockedEncounterRepo.loadEncounters.mockResolvedValue([])
  );

  it("returns encounter when found", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedEncounterRepo.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await GET(makeRequest("GET"), { params });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(ENC_ID);
  });

  itReturns500WithParams(
    GET,
    () => makeRequest("GET"),
    params,
    () => mockedEncounterRepo.loadEncounters.mockRejectedValue(new Error("Storage error"))
  );
});

describe("PUT /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(PUT, () => makeRequest("PUT", {}), params);

  itReturns404WithParams(
    PUT,
    () => makeRequest("PUT", { name: "New Name" }),
    params,
    () => mockedEncounterRepo.loadEncounters.mockResolvedValue([])
  );

  it("returns 400 when name is empty after update", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedEncounterRepo.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);

    const response = await PUT(makeRequest("PUT", { name: "  " }), { params });
    expect(response.status).toBe(400);
  });

  it("updates encounter and returns 200", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedEncounterRepo.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);
    mockedEncounterRepo.saveEncounter.mockResolvedValue(undefined as any);

    const response = await PUT(
      makeRequest("PUT", { name: "Updated Name", description: "New desc" }),
      { params }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe("Updated Name");
    expect(body.description).toBe("New desc");
    expect(mockedEncounterRepo.saveEncounter).toHaveBeenCalledTimes(1);
  });

  itReturns500WithParams(
    PUT,
    () => makeRequest("PUT", { name: "Valid" }),
    params,
    () => mockedEncounterRepo.loadEncounters.mockRejectedValue(new Error("Storage error"))
  );
});

describe("DELETE /api/encounters/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401WithParams(DELETE, () => makeRequest("DELETE"), params);

  itReturns404WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockedEncounterRepo.loadEncounters.mockResolvedValue([])
  );

  it("deletes encounter and returns 200", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedEncounterRepo.loadEncounters.mockResolvedValue([MOCK_ENCOUNTER] as any);
    mockedEncounterRepo.deleteEncounter.mockResolvedValue(undefined as any);

    const response = await DELETE(makeRequest("DELETE"), { params });

    expect(response.status).toBe(200);
    expect(mockedEncounterRepo.deleteEncounter).toHaveBeenCalledWith(
      ENC_ID,
      "user-123"
    );
  });

  itReturns500WithParams(
    DELETE,
    () => makeRequest("DELETE"),
    params,
    () => mockedEncounterRepo.loadEncounters.mockRejectedValue(new Error("Storage error"))
  );
});
