/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/parties/route";
import * as partyRepo from "@/lib/storage/partyRepo";
import { PartyCampaignAuthorizationError } from "@/lib/storage/errors";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401,
  itReturns500,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware());
jest.mock("@/lib/storage/partyRepo", () => ({
  loadParties: jest.fn(),
  saveParty: jest.fn(),
  deleteParty: jest.fn(),
  canAddToCampaignParty: jest.fn(),
  addPartyToCampaign: jest.fn(),
  isActiveDm: jest.fn(),
}));

const mockedPartyRepo = jest.mocked(partyRepo);

const MOCK_PARTIES = [
  { id: "party-1", userId: "user-123", name: "Fellowship", members: [] },
];

const BASE_URL = "http://localhost/api/parties";
const makeRequest = (body?: unknown) =>
  makeRouteRequest(BASE_URL, body !== undefined ? "POST" : "GET", body);

describe("GET /api/parties", () => {
  beforeEach(() => jest.clearAllMocks());

  itReturns401(GET, () => makeRequest());

  it("returns list of parties", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.loadParties.mockResolvedValue(MOCK_PARTIES as any);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Fellowship");
  });

  itReturns500(
    GET,
    () => makeRequest(),
    () => mockedPartyRepo.loadParties.mockRejectedValue(new Error("Storage error"))
  );
});

describe("POST /api/parties", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedPartyRepo as any).isActiveDm.mockResolvedValue(true);
  });

  itReturns401(POST, () => makeRequest({ name: "Crew" }));

  it("returns 400 when name is missing", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ characterIds: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "  " }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is a non-string type", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: 123 }));
    expect(response.status).toBe(400);
  });

  it("creates party and returns 201", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({
        name: "The Avengers",
        description: "Earth's mightiest heroes",
        characterIds: ["char-1", "char-2"],
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("The Avengers");
    expect(body.userId).toBe("user-123");
    expect(body.members).toHaveLength(2);
    expect(body.members.map((m: { characterId: string }) => m.characterId)).toEqual(["char-1", "char-2"]);
    expect(mockedPartyRepo.saveParty).toHaveBeenCalledTimes(1);
    const savedParty = (mockedPartyRepo.saveParty as jest.Mock).mock.calls[0][0];
    expect(savedParty._id).toBeUndefined();
    expect(savedParty.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  itReturns500(
    POST,
    () => makeRequest({ name: "Doomed Party" }),
    () => mockedPartyRepo.saveParty.mockRejectedValue(new Error("Storage error"))
  );

  it("B2-1: returns 403 when campaignId set and character not shared", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(false);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: ["char-foreign"] })
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("not shared");
  });

  it("B2-1b: returns 403 before checking sharing when caller is not an active DM of the campaign", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).isActiveDm.mockResolvedValue(false);
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: ["char-1"] })
    );

    expect(response.status).toBe(403);
    expect((mockedPartyRepo as any).canAddToCampaignParty).not.toHaveBeenCalled();
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("B2-2: returns 201 when campaignId set and shared character allowed", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: ["char-shared"] })
    );

    expect(response.status).toBe(201);
  });

  it("B2-3: no share check when campaignId absent", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "No Campaign", characterIds: ["char-1"] }));

    expect(response.status).toBe(201);
    expect((mockedPartyRepo as any).canAddToCampaignParty).not.toHaveBeenCalled();
  });

  it("returns 400 when characterIds is not an array", async () => {
    mockAuthState.payload = MOCK_AUTH;

    const response = await POST(makeRequest({ name: "Bad Ids", characterIds: "not-an-array" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("characterIds");
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 when characterIds contains a non-string element", async () => {
    mockAuthState.payload = MOCK_AUTH;

    const response = await POST(makeRequest({ name: "Bad Ids", characterIds: ["char-1", 42] }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("characterIds");
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 for each non-string, non-undefined campaignId type", async () => {
    mockAuthState.payload = MOCK_AUTH;
    for (const badValue of [null, 42, true, [], {}]) {
      const response = await POST(makeRequest({ name: "Party", campaignId: badValue }));
      expect(response.status).toBe(400);
    }
  });

  it("treats a whitespace-only campaignId as unlink (empty), not an error", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "Party", campaignId: "   " }));

    expect(response.status).toBe(201);
    expect(mockedPartyRepo.addPartyToCampaign).not.toHaveBeenCalled();
  });

  it("returns 400 when campaignId exceeds the entity-id length limit", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "Party", campaignId: "x".repeat(201) }));
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("returns 400 when description is not a string", async () => {
    mockAuthState.payload = MOCK_AUTH;
    const response = await POST(makeRequest({ name: "Party", description: 42 }));
    expect(response.status).toBe(400);
    expect(mockedPartyRepo.saveParty).not.toHaveBeenCalled();
  });

  it("no share check or campaign link when campaignId is omitted", async () => {
    mockAuthState.payload = MOCK_AUTH;
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);

    const response = await POST(makeRequest({ name: "No Campaign" }));

    expect(response.status).toBe(201);
    expect(mockedPartyRepo.addPartyToCampaign).not.toHaveBeenCalled();
  });

  it("returns 403 and rolls back when addPartyToCampaign rejects with PartyCampaignAuthorizationError", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);
    mockedPartyRepo.addPartyToCampaign.mockRejectedValueOnce(
      new PartyCampaignAuthorizationError("camp-1", "user-123")
    );
    mockedPartyRepo.deleteParty.mockResolvedValue(undefined as any);

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: [] })
    );

    expect(response.status).toBe(403);
    expect(mockedPartyRepo.deleteParty).toHaveBeenCalledTimes(1);
  });

  it("still surfaces the original authorization error (not the cleanup failure) when the orphaned-party rollback delete fails", async () => {
    mockAuthState.payload = MOCK_AUTH;
    (mockedPartyRepo as any).canAddToCampaignParty.mockResolvedValue(true);
    mockedPartyRepo.saveParty.mockResolvedValue(undefined as any);
    mockedPartyRepo.addPartyToCampaign.mockRejectedValueOnce(
      new PartyCampaignAuthorizationError("camp-1", "user-123")
    );
    mockedPartyRepo.deleteParty.mockRejectedValueOnce(new Error("cleanup failed"));

    const response = await POST(
      makeRequest({ name: "Campaign Party", campaignId: "camp-1", characterIds: [] })
    );

    expect(response.status).toBe(403);
  });
});
