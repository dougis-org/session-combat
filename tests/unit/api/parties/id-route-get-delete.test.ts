/**
 * @jest-environment node
 */
import { GET as GET_ONE, DELETE } from "@/app/api/parties/[id]/route";
import * as partyRepo from "@/lib/storage/partyRepo";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/partyRepo", () => ({
  loadParties: jest.fn(),
  deleteParty: jest.fn(),
}));

const mockedPartyRepo = jest.mocked(partyRepo);

describe("GET /api/parties/[id]", () => {
  const PARAMS = Promise.resolve({ id: "party-123" });
  const makeReq = () => makeRouteRequest("http://localhost/api/parties/party-123", "GET");

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue([
      { id: "party-123", userId: "user-123", name: "Fellowship", members: [] },
    ] as any);
  });

  itReturns401WithParams(GET_ONE, makeReq, PARAMS);

  it("returns party when found", async () => {
    const response = await GET_ONE(makeReq(), { params: PARAMS });
    expect(response.status).toBe(200);
    expect((await response.json()).name).toBe("Fellowship");
  });

  itReturns404WithParams(
    GET_ONE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockResolvedValue([])
  );

  itReturns500WithParams(
    GET_ONE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockRejectedValue(new Error("DB error"))
  );
});

describe("DELETE /api/parties/[id]", () => {
  const PARAMS = Promise.resolve({ id: "party-123" });
  const makeReq = () => makeRouteRequest("http://localhost/api/parties/party-123", "DELETE");

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue([
      { id: "party-123", userId: "user-123", name: "Fellowship", members: [] },
    ] as any);
    mockedPartyRepo.deleteParty.mockResolvedValue(undefined as any);
  });

  itReturns401WithParams(DELETE, makeReq, PARAMS);

  it("deletes party and returns 200", async () => {
    const response = await DELETE(makeReq(), { params: PARAMS });
    expect(response.status).toBe(200);
    expect(mockedPartyRepo.deleteParty).toHaveBeenCalledWith("party-123", "user-123");
  });

  itReturns404WithParams(
    DELETE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockResolvedValue([])
  );

  itReturns500WithParams(
    DELETE,
    makeReq,
    PARAMS,
    () => mockedPartyRepo.loadParties.mockRejectedValue(new Error("DB error"))
  );
});
