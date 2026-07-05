/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route";
import { storage } from "@/lib/storage";
import {
  makeRouteRequest,
  itReturns401WithParams,
  itReturns500WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    loadPartiesByCampaign: jest.fn(),
    loadCharacters: jest.fn(),
    saveParty: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage);

const BASE_URL = "http://localhost/api/campaigns/camp-1/members/user-1/parties/party-1";
const makePutRequest = (body: unknown) => makeRouteRequest(BASE_URL, "PUT", body);
const PARAMS = Promise.resolve({ id: "camp-1", userId: "user-1", partyId: "party-1" });

describe("PUT /api/campaigns/[id]/members/[userId]/parties/[partyId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getMember.mockResolvedValue({ status: "active", role: "player" } as any);
    mockedStorage.loadPartiesByCampaign.mockResolvedValue([
      { id: "party-1", userId: "user-1", members: [{ characterId: "char-1" }] }
    ] as any);
    mockedStorage.loadCharacters.mockResolvedValue([{ id: "char-2" }] as any);
    mockedStorage.saveParty.mockResolvedValue(undefined as any);
  });

  itReturns401WithParams(PUT, () => makePutRequest({}), PARAMS);

  it("returns 400 if characterIds is not an array", async () => {
    const response = await PUT(makePutRequest({ characterIds: "not-an-array" }), { params: PARAMS });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("characterIds must be an array of strings");
  });

  it("returns 403 if caller is not DM and not the member themselves", async () => {
    // caller is user-123 (MOCK_AUTH.userId is "user-123" by default in helpers)
    // but PARAMS userId is user-1
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "player" } as any); // for caller
    
    const response = await PUT(makePutRequest({ characterIds: [] }), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("returns 404 if member not found", async () => {
    // caller is DM so they pass the first check
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "dm" } as any); // for caller
    mockedStorage.getMember.mockResolvedValueOnce(null as any); // for member

    const response = await PUT(makePutRequest({ characterIds: [] }), { params: PARAMS });
    expect(response.status).toBe(404);
  });

  it("returns 404 if party not found", async () => {
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "dm" } as any); // for caller
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "player" } as any); // for member
    mockedStorage.loadPartiesByCampaign.mockResolvedValue([]);

    const response = await PUT(makePutRequest({ characterIds: [] }), { params: PARAMS });
    expect(response.status).toBe(404);
  });

  it("returns 400 if character is not owned by member", async () => {
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "dm" } as any); // caller
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "player" } as any); // member
    // member only owns char-2
    const response = await PUT(makePutRequest({ characterIds: ["char-3"] }), { params: PARAMS });
    expect(response.status).toBe(400);
  });

  it("updates party members and returns 200", async () => {
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "dm" } as any);
    mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "player" } as any);
    
    const response = await PUT(makePutRequest({ characterIds: ["char-2"] }), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.members.find((m: any) => m.characterId === "char-2")).toBeDefined();
    expect(mockedStorage.saveParty).toHaveBeenCalled();
  });

  itReturns500WithParams(
    PUT,
    () => makePutRequest({ characterIds: [] }),
    PARAMS,
    () => {
      // Mock getMember for authorization checks to pass
      mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "dm" } as any); // caller
      mockedStorage.getMember.mockResolvedValueOnce({ status: "active", role: "player" } as any); // member
      mockedStorage.saveParty.mockRejectedValueOnce(new Error("DB error"));
    },
    "returns 500 when saveParty throws"
  );
});
